from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return str(v)

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    username: str
    password: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ScoreCard(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    sno: int
    source: str
    date: datetime
    reasoning: float  # Changed to float
    english: float    # Changed to float
    gs: float         # Changed to float
    aptitude: float   # Changed to float
    total: Optional[float] = None  # Changed to float
    attempt: float    # Changed to float
    correct: float    # Changed to float
    wrong: float      # Changed to float
    accuracy: Optional[float] = None
    percentile: float

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: str}

class ScoreCardCreate(BaseModel):
    source: str
    date: date
    reasoning: float
    english: float
    gs: float
    aptitude: float
    attempt: float
    correct: float
    wrong: float
    percentile: float
    
    class Config:
        json_encoders = {date: str}

    def dict(self, *args, **kwargs):
        data = super().dict(*args, **kwargs)
        if isinstance(data.get('date'), date):
            data['date'] = datetime.combine(data['date'], datetime.min.time())
        return data

class ScoreCardUpdate(BaseModel):
    source: Optional[str] = None
    date: Optional[date] = None
    reasoning: Optional[float] = None
    english: Optional[float] = None
    gs: Optional[float] = None
    aptitude: Optional[float] = None
    attempt: Optional[float] = None
    correct: Optional[float] = None
    wrong: Optional[float] = None
    percentile: Optional[float] = None
    
    class Config:
        json_encoders = {date: str}
    
    def dict(self, *args, **kwargs):
        data = super().dict(*args, **kwargs)
        if data.get('date') and isinstance(data['date'], date):
            data['date'] = datetime.combine(data['date'], datetime.min.time())
        return data