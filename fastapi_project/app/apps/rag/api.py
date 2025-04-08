from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    BackgroundTasks,
    UploadFile,
    File,
    WebSocket,
    WebSocketDisconnect,
    status,
    Request,
)
from typing import List, Dict, Any
import os
import json
import logging
from starlette.websockets import WebSocketState

from app.apps.rag.schemas import (
    TextData,
    QueryRequest,
    QueryResponse,
    QueryResult,
    DocumentResponse,
    BatchUploadResponse,
    FileUploadResult,
)
from app.apps.rag.services.embedding_service import EmbeddingService
from app.apps.rag.utils.vector_store import CloudVectorStore
from app.apps.rag.services.document_service import DocumentService
from app.apps.chat.services.rag_chat_service import get_rag_streaming_response

router = APIRouter(tags=["embeddings"])

# Get environment variables for Google Cloud Storage
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "your-gcs-bucket-name")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-gcs-project-id")

# Initialize services with GCS configuration
embedding_service = EmbeddingService()
vector_store = CloudVectorStore(bucket_name=BUCKET_NAME, project_id=GCP_PROJECT_ID)
document_service = DocumentService(bucket_name=BUCKET_NAME, project_id=GCP_PROJECT_ID)

# Make sure logger is initialized at module level
logger = logging.getLogger(__name__)


# Load embeddings on startup
@router.on_event("startup")
async def startup_load_embeddings():
    logger.info("Attempting to load embeddings from cloud storage...")
    loaded = vector_store.load_from_cloud()
    if loaded:
        logger.info("Embeddings loaded successfully.")
    else:
        logger.warning("Failed to load embeddings or no embeddings found.")


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


@router.post("/documents/upload", response_model=BatchUploadResponse)
async def upload_documents(request: Request, files: List[UploadFile] = File(...)):
    """Upload one or more document files (PDF, DOCX, TXT, etc.)"""
    logger.info(f"--- Upload Request Headers ---")
    logger.info(dict(request.headers))
    logger.info(f"--- End Upload Request Headers ---")

    allowed_extensions = [".pdf", ".docx", ".txt", ".md", ".csv"]
    results: List[FileUploadResult] = []
    successful_uploads = 0
    failed_uploads = 0

    for file in files:
        filename = file.filename
        file_ext = os.path.splitext(filename)[1].lower()

        if file_ext not in allowed_extensions:
            results.append(
                FileUploadResult(
                    filename=filename,
                    success=False,
                    message=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}",
                )
            )
            failed_uploads += 1
            continue

        try:
            # Read file content
            file_content = await file.read()

            # Process the document using document_service
            result = document_service.upload_document(file_content, filename)

            # Create text embeddings for each chunk
            text_chunks = result["text_chunks"]
            metadata_list = result["metadata_list"]

            # Generate embeddings
            embeddings = embedding_service.get_embeddings(text_chunks)

            # Prepare documents for vector store
            documents_to_add = []
            for i, chunk in enumerate(text_chunks):
                doc = {"text": chunk, "metadata": metadata_list[i]}
                documents_to_add.append(doc)

            # Add to vector store
            vector_store.add_documents(documents_to_add, embeddings)

            results.append(
                FileUploadResult(
                    filename=filename,
                    success=True,
                    message=f"Processed successfully with {result['chunk_count']} chunks.",
                    doc_id=result["doc_id"],
                    chunk_count=result["chunk_count"],
                )
            )
            successful_uploads += 1

        except Exception as e:
            logger.error(f"Error processing document {filename}: {str(e)}")
            results.append(
                FileUploadResult(
                    filename=filename,
                    success=False,
                    message=f"Error processing document: {str(e)}",
                )
            )
            failed_uploads += 1
        finally:
            await file.close()

    overall_message = f"Processed {len(files)} files. Successful: {successful_uploads}, Failed: {failed_uploads}."
    return BatchUploadResponse(results=results, overall_message=overall_message)


@router.get("/documents", response_model=List[Dict[str, Any]])
async def list_documents():
    """List all uploaded documents"""
    try:
        registry_blob = document_service.bucket.blob("documents/registry.json")

        if not registry_blob.exists():
            return []

        registry_content = registry_blob.download_as_string()
        registry = json.loads(registry_content.decode("utf-8"))

        return registry["documents"]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving document list: {str(e)}"
        )


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """Get information about a specific document"""
    try:
        # First check registry
        registry_blob = document_service.bucket.blob("documents/registry.json")
        registry_content = registry_blob.download_as_string()
        registry = json.loads(registry_content.decode("utf-8"))

        # Find the document in registry
        doc_info = next(
            (doc for doc in registry["documents"] if doc["doc_id"] == doc_id), None
        )

        if not doc_info:
            raise HTTPException(status_code=404, detail="Document not found")

        return doc_info
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving document: {str(e)}"
        )


@router.delete("/documents/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_document(doc_id: str):
    """Delete a document by ID from both storage and vector store"""
    try:
        # First delete from document storage
        doc_deleted = document_service.delete_document(doc_id)
        if not doc_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {doc_id} not found",
            )

        # Then remove from vector store
        vector_deleted = vector_store.delete_documents_by_id(doc_id)
        if not vector_deleted:
            # This is not critical - document might not be in vector store
            # or already processed, so just log it
            logging.warning(
                f"Document {doc_id} was deleted from storage but not found in vector store"
            )

        return {
            "message": f"Document {doc_id} deleted successfully",
            "doc_id": doc_id,
            "storage_deleted": doc_deleted,
            "vectors_deleted": vector_deleted,
        }
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logging.error(f"Error during document deletion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}",
        )


@router.websocket("/ws/rag-chat")
async def websocket_rag_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for RAG-enhanced customer support chat"""
    logger.info("RAG chat WebSocket connection attempt")

    try:
        # Accept the connection
        await websocket.accept()
        logger.info("RAG chat WebSocket connection accepted")

        # Get services from app state
        chat_service = websocket.app.state.chat_service
        embedding_service = websocket.app.state.embedding_service
        vector_store = websocket.app.state.vector_store

        while True:
            data = await websocket.receive_json()
            message = data.get("message")
            history = data.get("history", [])

            if not isinstance(message, str):
                await websocket.send_json(
                    {"error": "Invalid message format", "code": "invalid_format"}
                )
                continue

            try:
                # Use the RAG chat service to generate responses
                async for chunk in get_rag_streaming_response(
                    query=message,
                    embedding_service=embedding_service,
                    vector_store=vector_store,
                    chat_service=chat_service,
                    history=history,
                ):
                    await websocket.send_json({"chunk": chunk, "done": False})
                await websocket.send_json({"chunk": "", "done": True})
            except Exception as e:
                logger.error(f"RAG streaming error: {str(e)}")
                await websocket.send_json({"error": str(e), "code": "stream_error"})

    except WebSocketDisconnect:
        logger.info("RAG chat WebSocket disconnected")
    except Exception as e:
        logger.error(f"RAG chat WebSocket error: {str(e)}")
        if websocket.client_state != WebSocketState.DISCONNECTED:
            await websocket.close()
