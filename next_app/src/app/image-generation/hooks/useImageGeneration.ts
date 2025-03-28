import { useState } from "react";
import axiosInstance from "@/utils/axiosInstance";

// Constants for available models
const BASE_MODEL = "imagen-3.0-fast-generate-001";
const ADVANCED_MODEL = "imagen-3.0-generate-002";

interface ImageResponse {
  text_response: string;
  image_id: string;
  content_type: string;
}

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  // Available models: imagen-2.0-generate (base) or imagen-3.0-generate-002 (advanced)
  model_name?: string;
  aspect_ratio?: string; // Should be one of: '1:1', '3:4', '4:3', '16:9'
}

export interface ImageHistoryItem {
  id: string;
  prompt: string;
  style?: string;
  model_name?: string;
  aspect_ratio?: string;
  url: string;
  textResponse: string;
  timestamp: number;
}

// Extract base URL from axios instance or set it directly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useImageGeneration = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState<string>("");
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);

  const generateImage = async (params: GenerateImageParams) => {
    try {
      setIsLoading(true);
      setError(null);

      // First API call to generate the image
      const response = await axiosInstance.post<ImageResponse>(
        "/api/images/generate",
        {
          prompt: params.prompt,
          style: params.style || "default",
          model_name: params.model_name || BASE_MODEL,
          aspect_ratio: params.aspect_ratio || "1:1",
        }
      );

      const { image_id, text_response } = response.data;
      setTextResponse(text_response);

      // Set the URL with the correct base URL including port 8000
      const url = `${API_BASE_URL}/api/images/view/${image_id}`;
      setImageUrl(url);

      // Add to history
      const newHistoryItem: ImageHistoryItem = {
        id: image_id,
        prompt: params.prompt,
        style: params.style,
        model_name: params.model_name,
        aspect_ratio: params.aspect_ratio,
        url,
        textResponse: text_response,
        timestamp: Date.now(),
      };

      setImageHistory((prev) => [newHistoryItem, ...prev]);
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Failed to generate the image. Please try again.");
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setImageHistory([]);
  };

  return {
    generateImage,
    isLoading,
    error,
    imageUrl,
    textResponse,
    imageHistory,
    clearHistory,
    // Export model constants for use in UI components
    BASE_MODEL,
    ADVANCED_MODEL,
  };
};
