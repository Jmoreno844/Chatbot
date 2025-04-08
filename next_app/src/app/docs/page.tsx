"use client";

import { useState, useRef } from "react";
import { useDocuments } from "./hooks/useDocuments";

export default function DocumentsPage() {
  const { documents, loading, error, uploadDocuments, deleteDocument } =
    useDocuments();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const response = await uploadDocuments(files);

      const successfulUploads = response.results.filter((r) => r.success).length;
      const failedUploads = response.results.length - successfulUploads;

      if (successfulUploads > 0) {
        setUploadSuccess(`${successfulUploads} document(s) uploaded successfully.`);
      }
      if (failedUploads > 0) {
        setUploadError(`${failedUploads} document(s) failed to upload. Check console for details.`);
        response.results
          .filter((r) => !r.success)
          .forEach((r) => {
            console.error(`Upload failed for ${r.filename}: ${r.message}`);
          });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload request failed:", err);
      setUploadError("An unexpected error occurred during the upload request.");
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadSuccess(null);
        setUploadError(null);
      }, 5000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const response = await uploadDocuments(files);

      const successfulUploads = response.results.filter((r) => r.success).length;
      const failedUploads = response.results.length - successfulUploads;

      if (successfulUploads > 0) {
        setUploadSuccess(`${successfulUploads} document(s) uploaded successfully.`);
      }
      if (failedUploads > 0) {
        setUploadError(`${failedUploads} document(s) failed to upload. Check console for details.`);
        response.results
          .filter((r) => !r.success)
          .forEach((r) => {
            console.error(`Upload failed for ${r.filename}: ${r.message}`);
          });
      }
    } catch (err) {
      console.error("Upload request failed:", err);
      setUploadError("An unexpected error occurred during the upload request.");
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadSuccess(null);
        setUploadError(null);
      }, 5000);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      fileInputRef.current?.click();
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingId(docId);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const result = await deleteDocument(docId);
      setDeleteSuccess(
        `Document ${docId.substring(0, 8)}... deleted successfully`
      );
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (err) {
      setDeleteError(`Failed to delete document. Please try again.`);
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent, docId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleDeleteDocument(e as unknown as React.MouseEvent, docId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Documents</h1>

      {/* Upload Section */}
      <div
        className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Upload documents area. Click or drag and drop files here."
        onKeyDown={handleKeyDown}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-1">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported file formats: PDF, TXT, DOCX
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx"
          aria-label="File upload input"
          multiple
        />
      </div>

      {uploading && (
        <div className="mb-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-2">Uploading documents...</p>
        </div>
      )}

      {uploadError && (
        <div
          className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
          role="alert"
        >
          {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div
          className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg"
          role="alert"
        >
          {uploadSuccess}
        </div>
      )}

      {deleteError && (
        <div
          className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
          role="alert"
        >
          {deleteError}
        </div>
      )}

      {deleteSuccess && (
        <div
          className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg"
          role="alert"
        >
          {deleteSuccess}
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">Available Documents</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              onClick={handleRetry}
              tabIndex={0}
            >
              Retry
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No documents found. Upload your first document above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200" role="list">
            {documents.map((doc) => (
              <li
                key={doc.doc_id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
                tabIndex={0}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {doc.filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Chunks: {doc.chunk_count}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-3">
                      ID: {doc.doc_id.substring(0, 8)}...
                    </span>
                    <button
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
                      onClick={(e) => handleDeleteDocument(e, doc.doc_id)}
                      onKeyDown={(e) => handleDeleteKeyDown(e, doc.doc_id)}
                      disabled={deletingId === doc.doc_id}
                      aria-label={`Delete document ${doc.filename}`}
                      title="Delete document"
                      tabIndex={0}
                    >
                      {deletingId === doc.doc_id ? (
                        <div className="w-5 h-5 border-2 border-t-red-500 border-gray-200 rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
