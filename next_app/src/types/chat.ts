export enum MessageType {
  USER = "user",
  BOT = "bot",
  SYSTEM = "system",
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  isStreaming?: boolean;
}

export type WebSocketStatus = "connecting" | "connected" | "disconnected";

export interface WebSocketMessage {
  message: string;
  [key: string]: any;
}

export interface WebSocketHookOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export interface WebSocketHookResult {
  socketStatus: WebSocketStatus;
  sendMessage: (data: WebSocketMessage) => void;
  lastMessage: any;
  error: string | null;
  reconnect: () => void;
}
