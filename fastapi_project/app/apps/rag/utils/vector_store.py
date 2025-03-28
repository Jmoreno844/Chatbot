import numpy as np
from typing import List, Dict, Any, Optional
import json
import io
from google.cloud import storage


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
