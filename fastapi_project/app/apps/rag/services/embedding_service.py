from sentence_transformers import SentenceTransformer
from typing import List, Union, Optional
import numpy as np
import os
from huggingface_hub import login
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        hf_token: Optional[str] = None,
        use_auth: bool = True,
    ):
        """
        Initialize the embedding service with a sentence transformer model

        Args:
            model_name: Name of the model or path to local model
            hf_token: Hugging Face API token (will use HF_TOKEN env var if not provided)
            use_auth: Whether to try authentication with Hugging Face
        """
        # Try authentication if requested
        if use_auth:
            self._authenticate(hf_token)

        try:
            # First try loading the model directly
            self.model = SentenceTransformer(model_name)
            logger.info(f"Successfully loaded model: {model_name}")
        except Exception as e:
            logger.warning(f"Error loading model {model_name}: {e}")

            # Try fallback models
            fallbacks = [
                "paraphrase-MiniLM-L3-v2",  # Small and usually accessible
                "distiluse-base-multilingual-cased-v1",  # Another option
            ]

            for fallback in fallbacks:
                try:
                    logger.info(f"Trying fallback model: {fallback}")
                    self.model = SentenceTransformer(fallback)
                    logger.info(f"Successfully loaded fallback model: {fallback}")
                    break
                except Exception as fallback_e:
                    logger.warning(
                        f"Error loading fallback model {fallback}: {fallback_e}"
                    )
            else:
                # If we got here, all fallbacks failed
                raise RuntimeError(
                    "Failed to load any embedding model. Check your internet connection and HF token."
                )

    def _authenticate(self, token: Optional[str] = None):
        """Authenticate with Hugging Face"""
        hf_token = token or os.environ.get("HF_TOKEN")
        if hf_token:
            try:
                login(token=hf_token)
                logger.info("Successfully authenticated with Hugging Face")
            except Exception as e:
                logger.warning(f"Failed to authenticate with Hugging Face: {e}")
        else:
            logger.warning(
                "No Hugging Face token provided, some models might not be accessible"
            )

    def get_embeddings(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Generate embeddings for a text or list of texts"""
        return self.model.encode(texts)
