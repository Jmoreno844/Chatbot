import { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";
import axios from "axios"; // Import axios to use isAxiosError

// Define interfaces matching the backend Pydantic models
interface Document {
  doc_id: string;
  filename: string;
  gcs_path: string;
  chunk_count: number;
  message: string;
}

interface FileUploadResult {
  filename: string;
  success: boolean;
  message: string;
  doc_id?: string;
  chunk_count?: number;
}

interface BatchUploadResponse {
  results: FileUploadResult[];
  overall_message: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/documents");
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocuments = async (files: FileList | File[]): Promise<BatchUploadResponse> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append("files", file);
    });

    try {
      // Remove the explicit headers option
      const response = await axiosInstance.post<BatchUploadResponse>(
        "/api/documents/upload",
        formData
        // No headers object here, let axios set it automatically for FormData
      );

      await fetchDocuments();
      return response.data;
    } catch (err) {
      console.error("Error uploading documents:", err);
      // Add specific handling for Axios errors, especially 422
      if (axios.isAxiosError(err) && err.response) {
         console.error("Axios error data:", err.response.data);
         if (err.response.status === 422) {
            // Try to extract a more specific message from FastAPI's validation error
            const detail = err.response.data?.detail;
            const errorMessage = Array.isArray(detail) && detail[0]?.msg
              ? `Validation Error: ${detail[0].msg} (field: ${detail[0].loc?.join(' > ')})`
              : `Validation Error (Status 422)`;
            throw new Error(errorMessage);
         } else {
            // Handle other HTTP errors
             throw new Error(`Upload failed with status: ${err.response.status}`);
         }
      }
      // Re-throw other types of errors (network errors, etc.)
      throw err;
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const response = await axiosInstance.delete(`/api/documents/${docId}`);
      await fetchDocuments();
      return response.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
  };
};
