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
import { Send, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";

export default function ChatPage() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentBotMessageId = useRef<string | null>(null);
  const messageProcessed = useRef<boolean>(false);

  const handleMessage = useCallback((data) => {
    console.log("WebSocket message received:", data);

    // If we've already processed a complete message, ignore any additional messages
    // until a new user message is sent
    if (messageProcessed.current && !currentBotMessageId.current) {
      console.log(
        "Ignoring duplicate message as we already completed processing"
      );
      return;
    }

    // Server sends messages with chunk and done fields
    if (data.chunk !== undefined) {
      // If this is the first chunk and no current message ID
      if (!currentBotMessageId.current) {
        const newMessageId = Date.now().toString();
        currentBotMessageId.current = newMessageId;
        messageProcessed.current = false;

        // Create initial message with first chunk
        const botMessage: Message = {
          id: newMessageId,
          content: data.chunk || "",
          type: MessageType.BOT,
          timestamp: new Date(),
          isStreaming: true,
        };

        setMessages((prev) => [...prev, botMessage]);
      }
      // If we already have a message being built
      else {
        // Append the chunk to the existing message
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
      }

      // If this is the final chunk (done is true)
      if (data.done === true) {
        console.log("Message stream complete");
        messageProcessed.current = true;
        currentBotMessageId.current = null;
        setIsLoading(false);
      }
    }
    // Fallback for other message formats - only process if we haven't handled a streaming message
    else if (data.message && !messageProcessed.current) {
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
    const wsProtocol =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "wss:"
        : "ws:";
    return (
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      `${wsProtocol}//localhost:8000/api/ws/rag-chat`
    );
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

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Format conversation history for the backend
  const formatHistoryForBackend = useCallback((messages: Message[]) => {
    return messages.map((message) => ({
      role: message.type === MessageType.USER ? "user" : "assistant",
      content: message.content,
    }));
  }, []);

  const handleSendMessage = () => {
    if (!input.trim() || isLoading || socketStatus !== "connected") return;

    // Reset message tracking when sending a new message
    messageProcessed.current = false;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: MessageType.USER,
      timestamp: new Date(),
    };

    // Update messages with the new user message
    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];

      // Send message with conversation history
      sendMessage({
        message: input,
        history: formatHistoryForBackend(updatedMessages.slice(0, -1)), // Send previous messages as history
      });

      return updatedMessages;
    });

    setInput("");
    setIsLoading(true);
    // Reset current bot message ID when sending a new message
    currentBotMessageId.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add a timeout to clear the loading state if no response is received
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log("Response timeout - clearing loading state");
          setIsLoading(false);
          if (currentBotMessageId.current) {
            // Mark any streaming message as completed
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
      }, 30000); // 30 second timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Connection error view with reconnect button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-6 text-red-500">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Connection Error
          </h1>
          <p className="text-center mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => reconnect()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2 transition-colors"
            aria-label="Try connecting again"
          >
            <Wifi className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gemini Chat</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  socketStatus === "connected"
                    ? "bg-green-500"
                    : socketStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                aria-hidden="true"
              />
              <span className="text-sm text-gray-600">{socketStatus}</span>
            </div>
            {socketStatus !== "connected" && (
              <button
                onClick={() => reconnect()}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Reconnect"
              >
                <Wifi className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-center">Start a conversation with Gemini...</p>
            {socketStatus !== "connected" && (
              <div className="mt-4 text-sm text-yellow-600 flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                <span>Waiting for connection...</span>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === MessageType.USER
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === MessageType.USER
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                  className={`text-xs mt-1 flex items-center ${
                    message.type === MessageType.USER
                      ? "text-blue-200"
                      : "text-gray-500"
                  }`}
                >
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
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-2 text-gray-800">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gemini is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="container mx-auto flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              socketStatus === "connected"
                ? "Type your message..."
                : "Waiting for connection..."
            }
            className="flex-grow resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
            rows={1}
            disabled={socketStatus !== "connected"}
            aria-label="Message input"
          />
          <button
            onClick={handleSendMessage}
            disabled={
              !input.trim() || isLoading || socketStatus !== "connected"
            }
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
