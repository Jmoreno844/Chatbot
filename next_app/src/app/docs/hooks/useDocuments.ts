import { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";

interface Document {
  doc_id: string;
  filename: string;
  gcs_path: string;
  chunk_count: number;
  message: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/documents/");
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(
        "/api/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Refresh the documents list
      await fetchDocuments();
      return response.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const response = await axiosInstance.delete(`/api/documents/${docId}`);
      // Refresh the documents list after deletion
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
    uploadDocument,
    deleteDocument,
  };
};
