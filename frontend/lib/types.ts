export type Role = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  tokens?: number;
};

export type Conversation = {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  updatedAt: string;
  pinned?: boolean;
};

export type ChatSettings = {
  temperature: number;
  maxTokens: number;
  topP: number;
  contextLength: number;
  systemPrompt: string;
};

export type UploadResult = {
  filename: string;
  chunks: number;
};
