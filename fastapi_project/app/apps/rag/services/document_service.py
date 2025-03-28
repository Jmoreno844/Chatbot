# app/apps/rag/services/document_service.py
from google.cloud import storage
import uuid
from typing import Dict, List, Any, BinaryIO, Tuple
import os
from datetime import datetime
from ..utils.document_parser import DocumentParser


class DocumentService:
    def __init__(self, bucket_name: str, project_id: str):
        self.bucket_name = bucket_name
        self.project_id = project_id
        self.storage_client = storage.Client(project=project_id)
        self.bucket = self.storage_client.bucket(bucket_name)
        self.document_parser = DocumentParser()

    def upload_document(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Upload a document to GCS and process it for RAG"""
        # Generate a unique ID for the document
        doc_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        # 1. Store original document in GCS
        file_ext = os.path.splitext(filename)[1].lower()
        gcs_path = f"documents/raw/{doc_id}{file_ext}"
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_string(
            file_content, content_type=self._get_content_type(file_ext)
        )

        # 2. Process the document
        try:
            parsed_data = self.document_parser.parse_file(file_content, filename)
            text_chunks = parsed_data["text_chunks"]
            metadata_list = parsed_data["metadata_list"]

            # 3. Enhance metadata for each chunk
            for i, metadata in enumerate(metadata_list):
                metadata.update(
                    {
                        "doc_id": doc_id,
                        "original_filename": filename,
                        "gcs_path": gcs_path,
                        "timestamp": timestamp,
                        "chunk_index": i,
                    }
                )

            return {
                "doc_id": doc_id,
                "filename": filename,
                "gcs_path": gcs_path,
                "chunk_count": len(text_chunks),
                "text_chunks": text_chunks,
                "metadata_list": metadata_list,
            }

        except Exception as e:
            # Delete uploaded file if processing fails
            blob.delete()
            raise e

    def _get_content_type(self, file_ext: str) -> str:
        """Get the appropriate content type for a file extension"""
        content_types = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
            ".csv": "text/csv",
        }
        return content_types.get(file_ext, "application/octet-stream")
