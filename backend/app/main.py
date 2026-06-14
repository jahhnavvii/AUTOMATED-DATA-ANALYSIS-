import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers.auth import router as auth_router
from .routers.upload import router as upload_router
from .routers.pipeline import router as pipeline_router
from .routers.report import router as report_router
from .routers.predict import router as predict_router

# Import models to ensure they are registered with Base.metadata
from .models.user import User
from .models.project import Project
from .models.dataset import Dataset, PipelineLog

# Create upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Create tables (Handled by Alembic migrations)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutoDS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     prefix="/auth",     tags=["auth"])
app.include_router(upload_router,   prefix="/upload",   tags=["upload"])
app.include_router(pipeline_router, prefix="/pipeline", tags=["pipeline"])
app.include_router(report_router,   prefix="/report",   tags=["report"])
app.include_router(predict_router,  prefix="/predict",  tags=["predict"])


@app.get("/health")
def health():
    return {"status": "ok"}
