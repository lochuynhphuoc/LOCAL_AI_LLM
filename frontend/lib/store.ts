import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSettings, Conversation } from "./types";

const now = () => new Date().toISOString();

const defaultSettings: ChatSettings = {
  temperature: 0.7,
  maxTokens: 16384,
  topP: 0.9,
  contextLength: 16384,
  systemPrompt: "You are GigaChat, an AI assistant specialized in agriculture. Provide practical, friendly, and concise guidance about crops, plant care, diseases, fertilizers, irrigation, and farming techniques."
};

const seedConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: "New consultation",
  model: "Qwen3-8B Q4_K_M",
  pinned: false,
  messages: [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hello! I\u2019m GigaChat \ud83c\udf31. How can I help with your crops today?",
      createdAt: now()
    }
  ],
  updatedAt: now()
});

export type ChatState = {
  conversations: Conversation[];
  currentConversationId: string;
  settings: ChatSettings;
  useRag: boolean;
  sidebarCollapsed: boolean;
  setUseRag: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  startNewChat: () => void;
  selectConversation: (id: string) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string, conversationId?: string) => void;
  setConversationTitle: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  deleteConversation: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setModel: (model: string) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const initial = seedConversation();
      return {
        conversations: [initial],
        currentConversationId: initial.id,
        settings: defaultSettings,
        useRag: false,
        sidebarCollapsed: false,
        setUseRag: (value) => set({ useRag: value }),
        setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
        startNewChat: () => {
          const state = get();
          const emptyConvo = state.conversations.find((conv) =>
            conv.messages.every(
              (msg) => msg.role !== "user" || msg.content.trim().length === 0
            )
          );
          if (emptyConvo) {
            set({ currentConversationId: emptyConvo.id });
            return;
          }
          const current = state.conversations.find(
            (conv) => conv.id === state.currentConversationId
          );
          if (current) {
            const hasUserContent = current.messages.some(
              (msg) => msg.role === "user" && msg.content.trim().length > 0
            );
            if (!hasUserContent) return;
          }
          const convo = seedConversation();
          set((prev) => ({
            conversations: [convo, ...prev.conversations],
            currentConversationId: convo.id
          }));
        },
        selectConversation: (id) => set({ currentConversationId: id }),
        updateSettings: (settings) =>
          set((state) => ({ settings: { ...state.settings, ...settings } })),
        addMessage: (message) => {
          const state = get();
          const id = state.currentConversationId || state.conversations[0].id;
          set({ currentConversationId: id });
          set((prev) => ({
            conversations: prev.conversations.map((conv) =>
              conv.id === id
                ? {
                    ...conv,
                    messages: [...conv.messages, message],
                    updatedAt: now()
                  }
                : conv
            )
          }));
        },
        updateMessage: (messageId, content, conversationId) => {
          const state = get();
          const id =
            conversationId ??
            state.currentConversationId ??
            state.conversations[0].id;
          set((prev) => ({
            conversations: prev.conversations.map((conv) =>
              conv.id === id
                ? {
                    ...conv,
                    messages: conv.messages.map((msg) =>
                      msg.id === messageId ? { ...msg, content } : msg
                    ),
                    updatedAt: now()
                  }
                : conv
            )
          }));
        },
        setConversationTitle: (id, title) =>
          set((prev) => ({
            conversations: prev.conversations.map((conv) =>
              conv.id === id ? { ...conv, title } : conv
            )
          })),
        togglePin: (id) =>
          set((prev) => ({
            conversations: prev.conversations.map((conv) =>
              conv.id === id ? { ...conv, pinned: !conv.pinned } : conv
            )
          })),
        deleteConversation: (id) => {
          const state = get();
          const remaining = state.conversations.filter((conv) => conv.id !== id);
          if (remaining.length === 0) {
            const fresh = seedConversation();
            set({ conversations: [fresh], currentConversationId: fresh.id });
            return;
          }
          const nextId =
            state.currentConversationId === id
              ? remaining[0].id
              : state.currentConversationId;
          set({ conversations: remaining, currentConversationId: nextId });
        },
        setMessages: (messages) => {
          const state = get();
          const id = state.currentConversationId || state.conversations[0].id;
          set((prev) => ({
            conversations: prev.conversations.map((conv) =>
              conv.id === id ? { ...conv, messages, updatedAt: now() } : conv
            )
          }));
        },
        setModel: (model) => {
          const state = get();
          const id = state.currentConversationId || state.conversations[0].id;
          set((prev) => ({
            conversations: prev.conversations.map((conv) =>
              conv.id === id ? { ...conv, model } : conv
            )
          }));
        }
    };
    },
    {
      name: "local-ai-chat",
      version: 2,
      migrate: (state) => {
        if (!state || typeof state !== "object") return state;
        const typed = state as ChatState;
        const contextLength = Math.max(typed.settings?.contextLength ?? 0, 16384);
        const maxTokens = Math.max(typed.settings?.maxTokens ?? 0, 16384);
        return {
          ...typed,
          settings: {
            ...typed.settings,
            contextLength,
            maxTokens: Math.min(maxTokens, contextLength)
          }
        };
      }
    }
  )
);

export function getCurrentConversation(state: ChatState): Conversation {
  if (state.currentConversationId) {
    const found = state.conversations.find(
      (conv) => conv.id === state.currentConversationId
    );
    if (found) return found;
  }
  return state.conversations[0];
}
