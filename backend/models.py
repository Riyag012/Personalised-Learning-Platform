from pydantic import BaseModel

class QueryRequest(BaseModel):
    query: str
    user_level: str

class QuizRequest(BaseModel):
    context: str

class SummaryRequest(BaseModel):
    context: str
    user_level: str