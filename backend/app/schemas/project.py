from pydantic import BaseModel
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str


class ProjectOut(BaseModel):
    id: str
    name: str
    domain: str | None
    status: str
    prediction_task: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class PipelineStartSchema(BaseModel):
    project_id: str
    dataset_id: str
    prediction_task: str
