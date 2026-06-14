from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..routers.auth import get_current_user
import json, os

router = APIRouter()


@router.get("/{project_id}")
def get_report(project_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    if project.status != "done":
        raise HTTPException(400, "Pipeline not complete yet")
    report_path = f"./reports/{project_id}_report.json"
    if not os.path.exists(report_path):
        raise HTTPException(404, "Report file not found")
    with open(report_path) as f:
        return json.load(f)


@router.get("/{project_id}/download")
def download_report(project_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    pdf_path = f"./reports/{project_id}_report.pdf"
    if not os.path.exists(pdf_path):
        raise HTTPException(404, "PDF not ready")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"autods_report_{project_id[:8]}.pdf")
