# app/apps/rag/utils/document_parser.py
import io
import os
from typing import List, Dict, Any, Optional
import docx
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentParser:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )

    def parse_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parse file content based on file type"""
        file_ext = os.path.splitext(filename)[1].lower()

        if file_ext == ".pdf":
            return self._parse_pdf(file_content, filename)
        elif file_ext == ".docx":
            return self._parse_docx(file_content, filename)
        elif file_ext in [".txt", ".md", ".csv"]:
            return self._parse_text(file_content, filename)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

    def _parse_pdf(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Extract text from PDF"""
        pdf_file = io.BytesIO(file_content)
        reader = PyPDF2.PdfReader(pdf_file)

        text_chunks = []
        metadata_list = []

        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if not page_text.strip():
                continue

            # Split text into chunks
            chunks = self.text_splitter.split_text(page_text)

            for j, chunk in enumerate(chunks):
                text_chunks.append(chunk)
                metadata_list.append(
                    {
                        "source": filename,
                        "page": i + 1,
                        "chunk": j + 1,
                        "file_type": "pdf",
                    }
                )

        return {"text_chunks": text_chunks, "metadata_list": metadata_list}

    def _parse_docx(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Extract text from DOCX"""
        docx_file = io.BytesIO(file_content)
        doc = docx.Document(docx_file)

        full_text = "\n".join(
            [para.text for para in doc.paragraphs if para.text.strip()]
        )
        chunks = self.text_splitter.split_text(full_text)

        metadata_list = [
            {"source": filename, "chunk": i + 1, "file_type": "docx"}
            for i in range(len(chunks))
        ]

        return {"text_chunks": chunks, "metadata_list": metadata_list}

    def _parse_text(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parse text files"""
        text = file_content.decode("utf-8", errors="replace")
        chunks = self.text_splitter.split_text(text)

        metadata_list = [
            {
                "source": filename,
                "chunk": i + 1,
                "file_type": os.path.splitext(filename)[1][1:],  # Remove the dot
            }
            for i in range(len(chunks))
        ]

        return {"text_chunks": chunks, "metadata_list": metadata_list}
