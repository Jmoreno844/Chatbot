import { useState, useEffect, useCallback, useRef } from "react";
import {
  WebSocketStatus,
  WebSocketMessage,
  WebSocketHookOptions,
  WebSocketHookResult,
} from "@/types/chat";

export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 2000,
  reconnectAttempts = 3,
}: WebSocketHookOptions): WebSocketHookResult => {
  const [socketStatus, setSocketStatus] =
    useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const socket = useRef<WebSocket | null>(null);
  const isMounted = useRef<boolean>(true);
  const isConnecting = useRef<boolean>(false);
  const reconnectCount = useRef<number>(0);

  const clearExistingSocket = useCallback(() => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isMounted.current || isConnecting.current) return;
    isConnecting.current = true;
    clearExistingSocket();

    setSocketStatus("connecting");
    console.log(`Connecting to WebSocket: ${url}`);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (!isMounted.current) {
        ws.close();
        return;
      }
      console.log("WebSocket connection established");
      setSocketStatus("connected");
      setError(null);
      isConnecting.current = false;
      reconnectCount.current = 0;
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

      // Auto-reconnect if we haven't exceeded attempts
      if (reconnectCount.current < reconnectAttempts && isMounted.current) {
        console.log(
          `Attempting to reconnect (${
            reconnectCount.current + 1
          }/${reconnectAttempts})...`
        );
        reconnectCount.current += 1;
        setTimeout(connect, reconnectInterval);
      }

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
    clearExistingSocket,
    reconnectInterval,
    reconnectAttempts,
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
