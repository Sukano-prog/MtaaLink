from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import os

from app.core.config import settings
from app.core.database import create_tables
from app.api.v1 import auth, members, groups, meetings, contributions, announcements, reports, projects, events, expenses, sms

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
    allow_origins=["*"],
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

from app.api.v1 import elections
app.include_router(elections.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_dir):
    # Mount directories only if they exist
    css_dir = os.path.join(frontend_dir, "css")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    js_dir = os.path.join(frontend_dir, "js")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    icons_dir = os.path.join(frontend_dir, "icons")
    if os.path.exists(icons_dir):
        app.mount("/icons", StaticFiles(directory=icons_dir), name="icons")
    assets_dir = os.path.join(frontend_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # Serve manifest.json and sw.js
    @app.get("/manifest.json")
    async def serve_manifest():
        return FileResponse(os.path.join(frontend_dir, "manifest.json"))
    
    @app.get("/sw.js")
    async def serve_sw():
        return FileResponse(os.path.join(frontend_dir, "sw.js"))
    
    @app.get("/offline.html")
    async def serve_offline():
        return FileResponse(os.path.join(frontend_dir, "offline.html"))
    
    @app.get("/favicon.ico")
    async def serve_favicon():
        return FileResponse(os.path.join(frontend_dir, "favicon.ico"))
    
    # Serve index.html for root
    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
    
    logger.info(f"Serving frontend from: {frontend_dir}")
else:
    logger.warning(f"Frontend directory not found: {frontend_dir}")

@app.on_event("startup")
async def startup_event():
    logger.info("Available Routes:")
    for route in app.routes:
        logger.info(f"  {route.path}")
    logger.info("Server ready")

# Import admin router
from app.api.v1 import admin
from app.api.v1 import setup
app.include_router(admin.router)
app.include_router(setup.router)

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
