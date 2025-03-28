import { useState, useEffect, useCallback, useRef } from "react";
import {
  WebSocketStatus,
  WebSocketMessage,
  WebSocketHookOptions,
  WebSocketHookResult,
} from "@/types/chat";
import axiosInstance from "@/utils/axiosInstance";

export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  maxTokenAttempts = 3,
}: WebSocketHookOptions): WebSocketHookResult => {
  const [socketStatus, setSocketStatus] =
    useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const socket = useRef<WebSocket | null>(null);
  const authToken = useRef<string | null>(null);
  const tokenAttemptCount = useRef<number>(0);
  const isMounted = useRef<boolean>(true);
  const isConnecting = useRef<boolean>(false); // New ref to track connection state

  const clearExistingSocket = useCallback(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
  }, []);

  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (!isMounted.current) return null;
    if (tokenAttemptCount.current >= maxTokenAttempts) {
      setError(`Maximum token fetch attempts (${maxTokenAttempts}) reached`);
      return null;
    }
    try {
      tokenAttemptCount.current += 1;
      console.log(
        `Fetching auth token (attempt ${tokenAttemptCount.current}/${maxTokenAttempts})...`
      );
      const response = await axiosInstance.post("/api/token");
      tokenAttemptCount.current = 0;
      return response.data.access_token;
    } catch (err) {
      setError(
        `Authentication failed (attempt ${
          tokenAttemptCount.current
        }/${maxTokenAttempts}): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return null;
    }
  }, [maxTokenAttempts]);

  const connect = useCallback(async () => {
    if (!isMounted.current || isConnecting.current) return;
    isConnecting.current = true; // Mark connection attempt started
    clearExistingSocket();

    setSocketStatus("connecting");
    if (!authToken.current) {
      authToken.current = await fetchToken();
      if (!authToken.current) {
        setSocketStatus("disconnected");
        isConnecting.current = false;
        return;
      }
    }

    const wsUrlWithToken = `${url}${url.includes("?") ? "&" : "?"}token=${
      authToken.current
    }`;
    console.log(`Connecting to WebSocket: ${wsUrlWithToken}`);
    const ws = new WebSocket(wsUrlWithToken);

    ws.onopen = () => {
      if (!isMounted.current) {
        ws.close();
        return;
      }
      console.log("WebSocket connection established");
      setSocketStatus("connected");
      setError(null);
      isConnecting.current = false;
      if (onOpen) onOpen();
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message received raw:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message parsed:", data);
        setLastMessage(data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        console.log("Raw message content:", event.data);
      }
    };

    ws.onclose = (event) => {
      console.log(
        `WebSocket closed with code ${event.code}, reason: ${
          event.reason || "No reason provided"
        }`
      );
      setSocketStatus("disconnected");
      isConnecting.current = false;
      if (onClose) onClose(event);
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket connection error");
      isConnecting.current = false;
      if (onError) onError(event);
    };

    socket.current = ws;
  }, [
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    fetchToken,
    clearExistingSocket,
  ]);

  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(data));
    } else {
      setError("Cannot send message, WebSocket is not connected");
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      clearExistingSocket();
    };
  }, [connect, clearExistingSocket]);

  return {
    socketStatus,
    sendMessage,
    lastMessage,
    error,
    reconnect: connect,
  };
};
