from celery import Celery
from ..config import settings

celery_app = Celery("autods", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"


@celery_app.task(name="run_pipeline_task")
def run_pipeline_task(project_id: str, dataset_id: str, prediction_task: str):
    from ..database import SessionLocal
    from ..models.project import Project
    from ..models.dataset import Dataset, PipelineLog
    from ...ml_engine.pipeline import run_full_pipeline
    import traceback
    from datetime import datetime, timezone

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
        db.query(Project).filter(Project.id == project_id).first().status = "failed"
        db.commit()
        traceback.print_exc()
        raise
