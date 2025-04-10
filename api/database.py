# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Update these with your MySQL credentials
USER = "root"
PASSWORD = ""
HOST = "localhost"
DB_NAME = "trainhub"

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{USER}:{PASSWORD}@{HOST}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()