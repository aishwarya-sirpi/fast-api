
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal


PriorityLevel = Literal["Low", "Medium", "High"]


class TaskCreate(BaseModel):
    title: str
    priority: PriorityLevel = "Medium"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[PriorityLevel] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    priority: PriorityLevel

    model_config = ConfigDict(from_attributes=True)
