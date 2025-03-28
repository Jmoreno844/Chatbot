from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from typing import List
import os

from app.apps.rag.schemas import (
    TextData,
    QueryRequest,
    QueryResponse,
    QueryResult,
    DocumentResponse,
)
from app.apps.rag.services.embedding_service import EmbeddingService
from app.apps.rag.utils.vector_store import CloudVectorStore
from app.apps.rag.services.document_service import DocumentService

router = APIRouter(tags=["embeddings"])

# Get environment variables for Google Cloud Storage
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "your-gcs-bucket-name")
GCS_PROJECT_ID = os.getenv("GCS_PROJECT_ID", "your-gcs-project-id")

# Initialize services with GCS configuration
embedding_service = EmbeddingService()
vector_store = CloudVectorStore(bucket_name=BUCKET_NAME, project_id=GCS_PROJECT_ID)
document_service = DocumentService(bucket_name=BUCKET_NAME, project_id=GCS_PROJECT_ID)


# Load embeddings on startup
@router.on_event("startup")
async def startup_load_embeddings():
    vector_store.load_from_cloud()


@router.post("/embeddings/encode")
def generate_embeddings(data: TextData):
    """Generate embeddings for a single text"""
    embedding = embedding_service.get_embeddings(data.text)
    return {"embedding": embedding.tolist()}


@router.post("/embeddings/add")
def add_documents(data: List[TextData], background_tasks: BackgroundTasks):
    """Add documents to the vector store"""
    texts = [item.text for item in data]
    embeddings = embedding_service.get_embeddings(texts)

    documents = []
    for i, item in enumerate(data):
        doc = {"text": item.text}
        if item.metadata:
            doc["metadata"] = item.metadata
        documents.append(doc)

    # Add documents to in-memory store
    vector_store.add_documents(documents, embeddings)

    return {"message": f"Added {len(documents)} documents to the vector store"}


@router.post("/embeddings/search", response_model=QueryResponse)
def search(query: QueryRequest):
    """Search for similar documents"""
    query_embedding = embedding_service.get_embeddings(query.query)
    results = vector_store.search(query_embedding, query.top_k)

    return QueryResponse(results=results)


@router.post("/embeddings/sync")
def force_sync():
    """Force sync of embeddings to cloud storage"""
    success = vector_store.save_to_cloud()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to sync with cloud storage")
    return {"message": "Sync successful"}


@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a document file (PDF, DOCX, TXT, etc.)"""
    # Validate file type
    allowed_extensions = [".pdf", ".docx", ".txt", ".md", ".csv"]
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}",
        )

    # Read file content
    file_content = await file.read()

    try:
        # Process the document
        result = document_service.upload_document(file_content, file.filename)

        # Create text embeddings for each chunk
        text_chunks = result["text_chunks"]
        metadata_list = result["metadata_list"]

        # Generate embeddings
        embeddings = embedding_service.get_embeddings(text_chunks)

        # Prepare documents for vector store
        documents = []
        for i, chunk in enumerate(text_chunks):
            doc = {"text": chunk, "metadata": metadata_list[i]}
            documents.append(doc)

        # Add to vector store
        vector_store.add_documents(documents, embeddings)

        return DocumentResponse(
            doc_id=result["doc_id"],
            filename=result["filename"],
            gcs_path=result["gcs_path"],
            chunk_count=result["chunk_count"],
            message=f"Document processed successfully with {result['chunk_count']} chunks",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing document: {str(e)}"
        )
