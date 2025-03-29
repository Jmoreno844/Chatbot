"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useWebSocket } from "@/app/chat/hooks/useWebSocket";
import { Message, MessageType } from "@/types/chat";
import { Send, Loader2, WifiOff } from "lucide-react";

// Define an interface for the WebSocket response data
interface WebSocketResponseData {
  chunk?: string;
  done?: boolean;
  message?: string;
}
//
export default function ChatPage() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentBotMessageId = useRef<string | null>(null);
  const messageProcessed = useRef<boolean>(false);

  const handleMessage = useCallback((data: WebSocketResponseData) => {
    console.log("WebSocket message received:", data);

    if (messageProcessed.current && !currentBotMessageId.current) {
      console.log(
        "Ignoring duplicate message as we already completed processing"
      );
      return;
    }

    if (data.chunk !== undefined) {
      if (!currentBotMessageId.current) {
        const newMessageId = Date.now().toString();
        currentBotMessageId.current = newMessageId;
        messageProcessed.current = false;

        const botMessage: Message = {
          id: newMessageId,
          content: data.chunk || "",
          type: MessageType.BOT,
          timestamp: new Date(),
          isStreaming: true,
        };

        setMessages((prev) => [...prev, botMessage]);
        setTimeout(() => scrollToBottom(), 50);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentBotMessageId.current
              ? {
                  ...msg,
                  content: msg.content + (data.chunk || ""),
                  isStreaming: !data.done,
                }
              : msg
          )
        );
        scrollToBottom();
      }

      if (data.done === true) {
        console.log("Message stream complete, setting isStreaming to false");
        // Explicitly update the message again to ensure isStreaming is false
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentBotMessageId.current
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
        messageProcessed.current = true;
        currentBotMessageId.current = null;
        setIsLoading(false);
      }
    } else if (data.message && !messageProcessed.current) {
      const newMessageId = Date.now().toString();
      const botMessage: Message = {
        id: newMessageId,
        content: data.message,
        type: MessageType.BOT,
        timestamp: new Date(),
        isStreaming: false,
      };

      setMessages((prev) => [...prev, botMessage]);
      messageProcessed.current = true;
      setIsLoading(false);
    }
  }, []);

  const handleOpen = useCallback(() => {
    console.log("WebSocket connected successfully");
  }, []);

  const handleClose = useCallback(() => {
    console.log("WebSocket connection closed");
  }, []);

  const wsBaseUrl = useMemo(() => {
    // Determine if we're using secure connection
    const isSecure =
      typeof window !== "undefined" && window.location.protocol === "https:";
    const wsProtocol = isSecure ? "wss:" : "ws:";

    // Get the API URL from environment variable or fallback to localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Create WebSocket URL by replacing http/https with ws/wss
    let wsUrl = apiUrl.replace(/^https?:/, wsProtocol);

    // Ensure the URL ends with /api/ws/rag-chat
    if (!wsUrl.endsWith("/api/ws/rag-chat")) {
      wsUrl = wsUrl.endsWith("/")
        ? `${wsUrl}api/ws/rag-chat`
        : `${wsUrl}/api/ws/rag-chat`;
    }

    return wsUrl;
  }, []);

  const { socketStatus, sendMessage, lastMessage, error, reconnect } =
    useWebSocket({
      url: wsBaseUrl,
      reconnectInterval: 2000,
      reconnectAttempts: 3,
      onMessage: handleMessage,
      onOpen: handleOpen,
      onClose: handleClose,
    });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  const formatHistoryForBackend = useCallback((messages: Message[]) => {
    return messages.map((message) => ({
      role: message.type === MessageType.USER ? "user" : "assistant",
      content: message.content,
    }));
  }, []);

  const handleSendMessage = () => {
    if (!input.trim() || isLoading || socketStatus !== "connected") return;

    messageProcessed.current = false;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: MessageType.USER,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];

      sendMessage({
        message: input,
        history: formatHistoryForBackend(updatedMessages.slice(0, -1)),
      });

      return updatedMessages;
    });

    setInput("");
    setIsLoading(true);
    currentBotMessageId.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log("Response timeout - clearing loading state");
          setIsLoading(false);
          if (currentBotMessageId.current) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === currentBotMessageId.current
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            currentBotMessageId.current = null;
          }
        }
      }, 30000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Add this new useEffect to ensure streaming state gets updated properly
  useEffect(() => {
    //  When loading state changes to false, make sure no messages are still marked as streaming
    if (!isLoading && currentBotMessageId.current === null) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  }, [isLoading]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-white">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-6 text-blue-500">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Connecting
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {socketStatus !== "connected" && (
        <div className="flex items-center justify-center p-2 bg-yellow-100 text-yellow-700">
          <WifiOff className="w-4 h-4 mr-2" />
          <span>Connecting...</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="w-8/12 mx-auto flex-grow flex flex-col justify-end">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-semibold mb-2">
                  Welcome to TechNova Solutions's Customer Support.
                </h2>
                <p className="text-lg">How can we assist you today?</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={`${message.id}-${message.content.length}`}
                className={`flex mb-4 ${
                  message.type === MessageType.USER
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.type === MessageType.USER
                      ? "bg-gray-200 text-black"
                      : "bg-white text-black"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs mt-1 flex items-center text-gray-500">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {message.isStreaming && (
                      <span className="ml-2">
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && !currentBotMessageId.current && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto p-2">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                socketStatus === "connected"
                  ? "Type your message..."
                  : "Waiting for connection..."
              }
              className="flex-grow resize-none border-none bg-transparent focus:outline-none text-black"
              rows={1}
              disabled={socketStatus !== "connected"}
              aria-label="Message input"
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !input.trim() || isLoading || socketStatus !== "connected"
              }
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
