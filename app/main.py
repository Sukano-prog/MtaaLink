from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import os

from app.core.config import settings
from app.core.database import create_tables
from app.api.v1 import auth, members, groups, meetings, contributions, announcements, reports, projects, events, expenses, sms, organization_settings
from app.api.v1 import accounts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    create_tables()
    logger.info("Database tables ready")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Village Management System for Kenya",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mtaalink-n3q0.onrender.com",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# API routes
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(groups.router)
app.include_router(meetings.router)
app.include_router(contributions.router)
app.include_router(announcements.router)
app.include_router(reports.router)
app.include_router(projects.router)
app.include_router(events.router)
app.include_router(expenses.router)
app.include_router(sms.router)
app.include_router(organization_settings.router)
app.include_router(accounts.router)

from app.api.v1 import elections
app.include_router(elections.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    logger.info("Available Routes:")
    for route in app.routes:
        logger.info(f"  {route.path}")
    logger.info("Server ready")

# Import admin router
from app.api.v1 import admin
from app.api.v1 import setup
from app.api.v1 import organizations
app.include_router(admin.router)
app.include_router(setup.router)
app.include_router(organizations.router)

# Initialize admin on startup
from app.core.init_db import init_admin
from app.core.database import SessionLocal

@app.on_event("startup")
async def startup():
    db = SessionLocal()
    try:
        init_admin(db)
        logger.info("Admin user initialized")
    finally:
        db.close()


# Serve frontend via catch-all route (must be last - after all API routes)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")



@app.get("/login")
async def login_page():
    from fastapi.responses import FileResponse
    return FileResponse("frontend/index.html")


@app.get("/reset-password")
async def reset_password_page():
    from fastapi.responses import FileResponse
    return FileResponse("frontend/reset-password.html")


@app.get("/settings")
async def settings_page():
    from fastapi.responses import FileResponse
    return FileResponse("frontend/index.html")

@app.get("/verify")
async def verify_page():
    from fastapi.responses import FileResponse
    return FileResponse("frontend/verify.html")

@app.get("/{path:path}")
async def serve_frontend(path: str):
    """Serve frontend files or index.html for SPA routing"""
    import os
    from fastapi.responses import FileResponse
    
    # Skip API routes - they are handled by the routers
    if path.startswith('api/'):
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = os.path.join(frontend_dir, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    return FileResponse(os.path.join(frontend_dir, "index.html"))

if os.path.exists(frontend_dir):
    logger.info(f"Serving frontend from: {frontend_dir}")
else:
    logger.warning(f"Frontend directory not found: {frontend_dir}")

