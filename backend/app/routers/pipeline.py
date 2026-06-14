from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models.project import Project
from ..models.dataset import Dataset, PipelineLog
from ..schemas.project import PipelineStartSchema
from ..routers.auth import get_current_user
from ..services.llm_service import detect_domain
import asyncio, json
import pandas as pd
import traceback
from datetime import datetime, timezone

router = APIRouter()


def _run_pipeline_sync(project_id: str, dataset_id: str, prediction_task: str):
    """Run the ML pipeline synchronously in a background thread (no Celery needed)."""
    from ...ml_engine.pipeline import run_full_pipeline
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        result = run_full_pipeline(
            project_id=project_id,
            dataset_path=dataset.storage_path,
            filename=dataset.original_filename,
            prediction_task=prediction_task,
            db=db
        )
        project = db.query(Project).filter(Project.id == project_id).first()
        project.status = "done"
        project.completed_at = datetime.now(timezone.utc)
        db.commit()
        return result
    except Exception as e:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = "failed"
            db.commit()
        traceback.print_exc()
        raise
    finally:
        db.close()


@router.get("/domains/{dataset_id}")
def get_domains(dataset_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    df = pd.read_csv(dataset.storage_path) if dataset.original_filename.endswith('.csv') \
        else pd.read_excel(dataset.storage_path)
    domain_info = asyncio.run(detect_domain(list(df.columns), df.head(3).fillna("").to_dict(orient="records")))
    return domain_info


@router.post("/start")
def start_pipeline(data: PipelineStartSchema, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == data.project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    project.status = "running"
    project.prediction_task = data.prediction_task
    db.commit()
    # Run in background thread instead of Celery
    background_tasks.add_task(_run_pipeline_sync, data.project_id, data.dataset_id, data.prediction_task)
    return {"message": "Pipeline started", "project_id": data.project_id}


@router.get("/status/{project_id}")
def pipeline_status(project_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    logs = db.query(PipelineLog).filter(PipelineLog.project_id == project_id).order_by(PipelineLog.created_at).all()
    return {
        "status": project.status,
        "logs": [{"stage": l.stage, "message": l.message, "decision": l.decision} for l in logs]
    }


@router.websocket("/ws/logs/{project_id}")
async def websocket_logs(websocket: WebSocket, project_id: str):
    await websocket.accept()
    last_id = 0
    try:
        while True:
            db = SessionLocal()
            try:
                logs = db.query(PipelineLog).filter(
                    PipelineLog.project_id == project_id,
                    PipelineLog.id > last_id
                ).order_by(PipelineLog.created_at).all()
                project = db.query(Project).filter(Project.id == project_id).first()

                for log in logs:
                    await websocket.send_text(json.dumps({
                        "stage": log.stage, "message": log.message, "decision": log.decision
                    }))
                    last_id = log.id

                if project and project.status in ("done", "failed"):
                    await websocket.send_text(json.dumps({"stage": "complete", "status": project.status}))
                    break
            finally:
                db.close()
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
