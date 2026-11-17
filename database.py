
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"

# Create database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for database models
Base = declarative_base()


def migrate_tasks_priority_column():
    with engine.begin() as connection:
        columns = {
            column["name"] for column in inspect(connection).get_columns("tasks")
        }
        if "priority" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE tasks "
                    "ADD COLUMN priority VARCHAR NOT NULL DEFAULT 'Medium'"
                )
            )


# Database connection dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
