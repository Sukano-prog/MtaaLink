from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Detect database type
is_sqlite = "sqlite" in settings.DATABASE_URL
is_neon = "neon.tech" in settings.DATABASE_URL

# Build engine args
engine_args = {
    "pool_pre_ping": True,   # Essential for Neon's scale-to-zero
}

if is_sqlite:
    engine_args["connect_args"] = {"check_same_thread": False}
elif is_neon:
    # Neon requires SSL and benefits from connection recycling
    engine_args["pool_recycle"] = 300        # Recycle connections every 5 min
    engine_args["pool_size"] = 5
    engine_args["max_overflow"] = 10
    engine_args["connect_args"] = {"sslmode": "require"}

engine = create_engine(settings.DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
