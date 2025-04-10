# models.py (simplified)
from sqlalchemy import Column, String, Table, ForeignKey
from sqlalchemy.orm import relationship, Session
import schemas
from database import Base
import uuid

# Association table for exercise-tag many-to-many relationship
exercise_tag = Table(
    "exercise_tag",
    Base.metadata,
    Column("exercise_id", String(36), ForeignKey("exercises.id")),
    Column("tag_name", String(50), ForeignKey("tags.name"))
)

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    instructions = Column(String(2000), nullable=True)
    enrichment = Column(String(1000), nullable=True)
    video_url = Column(String(255), nullable=True)
    
    # Relationship to tags
    tags = relationship("Tag", secondary=exercise_tag, back_populates="exercises")

class Tag(Base):
    __tablename__ = "tags"

    name = Column(String(50), primary_key=True, index=True)
    
    # Relationship to exercises
    exercises = relationship("Exercise", secondary=exercise_tag, back_populates="tags")

# CRUD Operations
def get_exercise(db: Session, exercise_id: str):
    return db.query(Exercise).filter(Exercise.id == exercise_id).first()

def create_exercise(db: Session, exercise: schemas.ExerciseCreate):
    # Get or create tags
    db_tags = []
    for tag_name in exercise.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
        db_tags.append(tag)
    
    # Create new exercise
    db_exercise = Exercise(
        id=exercise.id,
        name=exercise.name,
        instructions=exercise.instructions,
        enrichment=exercise.enrichment,
        video_url=exercise.video_url,
        tags=db_tags
    )
    
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise

def update_exercise(db: Session, exercise_id: str, exercise: schemas.ExerciseUpdate):
    db_exercise = get_exercise(db, exercise_id)
    
    # Update simple fields
    db_exercise.name = exercise.name
    db_exercise.instructions = exercise.instructions
    db_exercise.enrichment = exercise.enrichment
    db_exercise.video_url = exercise.video_url
    
    # Update tags
    db_exercise.tags = []
    for tag_name in exercise.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
        db_exercise.tags.append(tag)
    
    db.commit()
    db.refresh(db_exercise)
    return db_exercise

def delete_exercise(db: Session, exercise_id: str):
    db_exercise = get_exercise(db, exercise_id)
    db.delete(db_exercise)
    db.commit()

def get_all_tags(db: Session):
    tags = db.query(Tag.name).all()
    return [tag[0] for tag in tags]