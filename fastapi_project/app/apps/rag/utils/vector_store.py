import numpy as np
from typing import List, Dict, Any, Optional
import json
import io
from google.cloud import storage
import logging

logger = logging.getLogger(__name__)


class CloudVectorStore:
    def __init__(
        self,
        bucket_name: str,
        project_id: str,
        key_prefix: str = "embeddings/",
    ):
        self.documents = []
        self.embeddings = np.array([])
        self.bucket_name = bucket_name
        self.project_id = project_id
        self.key_prefix = key_prefix

        # Initialize Google Cloud Storage client
        self.storage_client = storage.Client(project=project_id)
        self.bucket = self.storage_client.bucket(bucket_name)

        self.metadata_key = f"{key_prefix}metadata.json"
        self.embeddings_key = f"{key_prefix}embeddings.npy"

    def load_from_cloud(self) -> bool:
        """Load embeddings and documents from cloud storage"""
        try:
            # Load metadata (documents)
            metadata_blob = self.bucket.blob(self.metadata_key)
            if not metadata_blob.exists():
                print(f"Metadata file doesn't exist: {self.metadata_key}")
                return False

            metadata_content = metadata_blob.download_as_string()
            self.documents = json.loads(metadata_content.decode("utf-8"))

            # Load embeddings
            embeddings_blob = self.bucket.blob(self.embeddings_key)
            if not embeddings_blob.exists():
                print(f"Embeddings file doesn't exist: {self.embeddings_key}")
                return False

            embeddings_content = embeddings_blob.download_as_string()
            self.embeddings = np.load(io.BytesIO(embeddings_content))

            print(
                f"Loaded {len(self.documents)} documents and embeddings from cloud storage"
            )
            return True
        except Exception as e:
            print(f"Error loading from cloud storage: {e}")
            # Initialize with empty data
            self.documents = []
            self.embeddings = np.array([])
            return False

    def save_to_cloud(self) -> bool:
        """Save embeddings and documents to cloud storage"""
        try:
            # Save metadata (documents)
            metadata_blob = self.bucket.blob(self.metadata_key)
            metadata_bytes = json.dumps(self.documents).encode("utf-8")
            metadata_blob.upload_from_string(
                metadata_bytes, content_type="application/json"
            )

            # Save embeddings
            embeddings_bytes = io.BytesIO()
            np.save(embeddings_bytes, self.embeddings)
            embeddings_bytes.seek(0)

            embeddings_blob = self.bucket.blob(self.embeddings_key)
            embeddings_blob.upload_from_string(
                embeddings_bytes.getvalue(), content_type="application/octet-stream"
            )

            print(
                f"Saved {len(self.documents)} documents and embeddings to cloud storage"
            )
            return True
        except Exception as e:
            print(f"Error saving to cloud storage: {e}")
            return False

    def add_documents(
        self, documents: List[Dict[str, Any]], embeddings: np.ndarray
    ) -> bool:
        """Add documents and their embeddings to the store"""
        self.documents.extend(documents)

        if self.embeddings.size == 0:
            self.embeddings = embeddings
        else:
            self.embeddings = np.vstack([self.embeddings, embeddings])

        # Sync to cloud storage
        return self.save_to_cloud()

    def search(
        self, query_embedding: np.ndarray, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using cosine similarity"""
        if len(self.embeddings) == 0:
            return []

        # Calculate cosine similarity
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )

        # Get top-k indices
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        return [
            {"document": self.documents[i], "score": float(similarities[i])}
            for i in top_indices
        ]

    def delete_documents_by_id(self, doc_id: str) -> bool:
        """Delete all documents with the specified doc_id from vector store"""
        if not self.documents or len(self.documents) == 0:
            logger.warning(f"No documents in vector store to delete for {doc_id}")
            return False

        # Find indices of documents with matching doc_id
        indices_to_remove = []
        for i, doc in enumerate(self.documents):
            metadata = doc.get("metadata", {})
            if metadata.get("doc_id") == doc_id:
                indices_to_remove.append(i)

        if not indices_to_remove:
            logger.warning(f"No documents with doc_id {doc_id} found in vector store")
            return False  # No matching documents found

        # Create a mask of documents to keep
        keep_mask = np.ones(len(self.documents), dtype=bool)
        for idx in indices_to_remove:
            keep_mask[idx] = False

        # Update documents and embeddings
        self.documents = [d for i, d in enumerate(self.documents) if keep_mask[i]]
        self.embeddings = self.embeddings[keep_mask]

        logger.info(f"Removed {len(indices_to_remove)} embeddings for doc_id {doc_id}")

        # Sync to cloud storage
        return self.save_to_cloud()
