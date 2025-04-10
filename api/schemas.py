# schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class ExerciseBase(BaseModel):
    name: str
    instructions: Optional[str] = None
    enrichment: Optional[str] = None
    video_url: Optional[str] = None
    tags: List[str] = []

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(ExerciseBase):
    pass

class Exercise(ExerciseBase):
    id: str

    class Config:
        orm_mode = True