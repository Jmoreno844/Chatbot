"use client";

import { useState, useRef } from "react";
import { useDocuments } from "./hooks/useDocuments";

export default function DocumentsPage() {
  const { documents, loading, error, uploadDocument } = useDocuments();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await uploadDocument(files[0]);
      setUploadSuccess("Document uploaded successfully!");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
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
      await uploadDocument(files[0]);
      setUploadSuccess("Document uploaded successfully!");
    } catch (err) {
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
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
        aria-label="Upload document area. Click or drag and drop a file here."
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
            Drag and drop a file here, or click to select a file
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
        />
      </div>

      {uploading && (
        <div className="mb-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-2">Uploading document...</p>
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
                  <span className="text-sm text-gray-500">
                    ID: {doc.doc_id.substring(0, 8)}...
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
