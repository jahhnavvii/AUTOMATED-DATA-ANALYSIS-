import os, uuid, magic
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
import pandas as pd
from ..database import get_db
from ..models.project import Project
from ..models.dataset import Dataset
from ..routers.auth import get_current_user
from ..config import settings

router = APIRouter()

ALLOWED_MIME = {"text/csv", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}


@router.post("")
async def upload_dataset(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Size check
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    # MIME check
    mime = magic.from_buffer(contents[:2048], mime=True)
    if mime not in ALLOWED_MIME and not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(400, "Only CSV and Excel files are allowed")

    # Create project
    project = Project(user_id=current_user.id, name=file.filename.rsplit('.', 1)[0])
    db.add(project)
    db.flush()

    # Save file
    safe_name = f"{uuid.uuid4()}.{file.filename.rsplit('.', 1)[-1]}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(contents)

    # Read preview
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(save_path, nrows=100)
        else:
            df = pd.read_excel(save_path, nrows=100)
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {str(e)}")

    cols_info = {col: str(df[col].dtype) for col in df.columns}

    dataset = Dataset(
        project_id=project.id,
        original_filename=file.filename,
        storage_path=save_path,
        row_count=len(df),
        col_count=len(df.columns),
        columns_json=cols_info
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return {
        "project_id": str(project.id),
        "dataset_id": str(dataset.id),
        "filename": file.filename,
        "rows": dataset.row_count,
        "columns": dataset.col_count,
        "column_info": cols_info,
        "preview": df.head(10).fillna("").to_dict(orient="records")
    }
