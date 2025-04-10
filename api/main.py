# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from database import SessionLocal, engine
import models
import schemas

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Exercise API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/exercises/", response_model=List[schemas.Exercise])
def get_exercises(db: Session = Depends(get_db())):
    exercises = db.query(models.Exercise).all()
    return [
        schemas.Exercise(
            id=ex.id,
            name=ex.name,
            instructions=ex.instructions,
            enrichment=ex.enrichment,
            video_url=ex.video_url,
            tags=[tag.name for tag in ex.tags]
        )
        for ex in exercises
    ]

@app.get("/exercises/{exercise_id}", response_model=schemas.Exercise)
def get_exercise(exercise_id: str, db: Session = Depends(get_db)):
    """Get a specific exercise by ID"""
    db_exercise = models.get_exercise(db, exercise_id)
    if db_exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return db_exercise

@app.post("/exercises/", response_model=schemas.Exercise)
def create_exercise(exercise: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    """Create a new exercise"""
    return models.create_exercise(db=db, exercise=exercise)

@app.put("/exercises/{exercise_id}", response_model=schemas.Exercise)
def update_exercise(exercise_id: str, exercise: schemas.ExerciseUpdate, db: Session = Depends(get_db)):
    """Update an existing exercise"""
    db_exercise = models.get_exercise(db, exercise_id)
    if db_exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return models.update_exercise(db=db, exercise_id=exercise_id, exercise=exercise)

@app.delete("/exercises/{exercise_id}")
def delete_exercise(exercise_id: str, db: Session = Depends(get_db)):
    """Delete an exercise"""
    db_exercise = models.get_exercise(db, exercise_id)
    if db_exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    models.delete_exercise(db=db, exercise_id=exercise_id)
    return {"message": "Exercise deleted successfully"}

@app.get("/tags/", response_model=List[str])
def get_all_tags(db: Session = Depends(get_db)):
    """Get all unique tags from exercises"""
    return models.get_all_tags(db)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)