# setup_database.py
import mysql.connector
from sqlalchemy import create_engine
from database import Base, SQLALCHEMY_DATABASE_URL
import models

def create_database(db_name="trainhub", user="root", password="", host="localhost"):
    """Create the database if it doesn't exist"""
    # Connect to MySQL server without specifying a database
    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password
    )
    cursor = conn.cursor()
    
    # Create database if it doesn't exist
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    
    # Close connection
    cursor.close()
    conn.close()
    
    print(f"Database '{db_name}' created or already exists")

def create_tables():
    """Create tables using SQLAlchemy models"""
    # Create database engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Create all tables defined in models.py
    Base.metadata.create_all(bind=engine)
    
    print("Tables created successfully")

if __name__ == "__main__":
    # Update these with your MySQL credentials
    user = "root"
    password = ""
    host = "localhost"
    db_name = "trainhub"
    
    # Create database
    create_database(db_name, user, password, host)
    
    # Make sure to update the connection string in database.py with the same credentials
    # SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{user}:{password}@{host}/{db_name}"
    
    # Create tables
    create_tables()