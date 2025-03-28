# app/apps/rag/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, File


class TextData(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None


class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    gcs_path: str
    chunk_count: int
    message: str


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5


class QueryResult(BaseModel):
    document: Dict[str, Any]
    score: float


class QueryResponse(BaseModel):
    results: List[QueryResult]
