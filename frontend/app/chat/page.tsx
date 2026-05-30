"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { MessageList } from "../../components/chat/MessageList";
import { Composer } from "../../components/chat/Composer";
import { ScrollToBottomButton } from "../../components/chat/ScrollToBottomButton";
import { TypingIndicator } from "../../components/chat/TypingIndicator";
import { Topbar } from "../../components/layout/Topbar";
import { useScrollAnchor } from "../../hooks/use-scroll-anchor";
import { getCurrentConversation, useChatStore } from "../../lib/store";
import type { ChatMessage } from "../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));
const SUGGESTIONS = [
  "Which crops grow best during rainy season?",
  "How do I identify rice plant diseases?",
  "Recommend fertilizer for tomato plants",
  "Suggest crops for sandy soil",
  "How often should I water chili plants?",
  "Improve crop yield with smart irrigation"
];

export default function ChatPage() {
  const {
    settings,
    addMessage,
    updateMessage,
    setMessages,
    setModel,
    useRag
  } = useChatStore();
  const conversation = useChatStore(getCurrentConversation);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [scrollNudge, setScrollNudge] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wasStreamingRef = useRef(false);
  const router = useRouter();
  const isEmpty = conversation.messages.filter((msg) => msg.role === "user").length === 0;

  const { containerRef, endRef, showScroll, scrollToBottom } = useScrollAnchor(!isEmpty);

  const startStream = async (
    messages: ChatMessage[],
    assistantId: string,
    conversationId: string
  ) => {
    const systemPrompt = settings.systemPrompt?.trim();
    const finalMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    const payload = {
      messages: finalMessages.map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: true,
      use_rag: useRag
    };

    abortRef.current = new AbortController();

    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abortRef.current.signal
    });

    if (!response.ok || !response.body) {
      throw new Error("stream_failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let assistantText = "";
    let buffer = "";

    const flushEvent = (event: string) => {
      const trimmed = event.trim();
      if (!trimmed.startsWith("data: ")) return;

      const data = trimmed.replace(/^data: /, "").trim();
      if (!data || data === "[DONE]") return;

      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) {
        assistantText += delta;
        updateMessage(assistantId, assistantText, conversationId);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        flushEvent(event);
      }
    }

    if (buffer.trim()) {
      flushEvent(buffer);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    const conversationId = conversation.id;

    setInput("");
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      tokens: estimateTokens(content)
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      tokens: 0
    };

    addMessage(userMessage);
    addMessage(assistantMessage);
    setIsStreaming(true);

    try {
      await startStream(
        [...conversation.messages, userMessage, assistantMessage],
        assistantMessage.id,
        conversationId
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const currentAssistant = useChatStore
        .getState()
        .conversations.flatMap((conversation) => conversation.messages)
        .find((message) => message.id === assistantMessage.id);

      if (!currentAssistant?.content.trim()) {
        updateMessage(
          assistantMessage.id,
          "Không thể kết nối đến backend. Hãy kiểm tra Docker Compose và Ollama.",
          conversationId
        );
      }
    } finally {
      setIsStreaming(false);
      scrollToBottom();
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleRegenerate = async () => {
    const lastUser = [...conversation.messages].reverse().find((msg) => msg.role === "user");
    if (!lastUser) return;
    const updatedMessages = [...conversation.messages];
    const lastAssistant = updatedMessages.reverse().find((msg) => msg.role === "assistant");
    if (!lastAssistant) return;

    const conversationId = conversation.id;

    updateMessage(lastAssistant.id, "", conversationId);
    setIsStreaming(true);
    try {
      await startStream(conversation.messages, lastAssistant.id, conversationId);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const currentAssistant = useChatStore
        .getState()
        .conversations.flatMap((conversation) => conversation.messages)
        .find((message) => message.id === lastAssistant.id);

      if (!currentAssistant?.content.trim()) {
        updateMessage(
          lastAssistant.id,
          "Không thể kết nối đến backend. Hãy kiểm tra Docker Compose và Ollama.",
          conversationId
        );
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleEdit = (id: string, content: string) => {
    setInput(content);
    const index = conversation.messages.findIndex((msg) => msg.id === id);
    if (index === -1) return;
    const trimmed = conversation.messages.slice(0, index);
    setMessages(trimmed);
  };

  const handleUploadClick = () => {
    router.push("/knowledge");
  };

  useEffect(() => {
    if (!showScroll) {
      scrollToBottom();
    }
  }, [conversation.messages.length, showScroll, scrollToBottom]);

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && showScroll) {
      setScrollNudge(true);
      const timer = window.setTimeout(() => setScrollNudge(false), 1200);
      return () => window.clearTimeout(timer);
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, showScroll]);

  return (
    <AppShell title="GigaChat" headerRight={<Topbar />}>
      <div className="chat-surface min-h-screen">
        <div className="hidden w-full items-center justify-between px-6 pt-4 text-xs text-muted-foreground lg:flex">
          <div className="flex items-center gap-2">
            <span className="text-foreground">GigaChat</span>
            <select
              value={conversation.model}
              onChange={(event) => setModel(event.target.value)}
              className="select-glass"
            >
              <option>Qwen3-8B Q4_K_M</option>
              <option>Qwen3-30B A3B</option>
              <option>Llama 3.1 8B</option>
            </select>
          </div>
          <Topbar />
        </div>

        <div className="mx-auto flex h-[calc(100vh-96px)] w-full max-w-3xl flex-col overflow-hidden px-4 pt-4 lg:h-[calc(100vh-72px)]">

          {isEmpty ? (
            <div className="fade-in flex flex-1 flex-col items-center justify-center gap-6 pb-16 text-center">
              <div className="space-y-2">
                <Image
                  src="/gigachat.png"
                  alt="GigaChat"
                  width={34}
                  height={34}
                  className="welcome-icon-plain"
                />
                <h1 className="hero-title text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Welcome to <span className="brand-title">Giga</span>
                  <span className="brand-accent">Chat</span>
                </h1>
                <p className="text-sm text-muted-foreground/80">
                  Your AI assistant for smarter farming and healthier crops.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    onClick={() => setInput(text)}
                    className="suggestion-pill"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-[820px]">
                <div className="mb-2 flex w-full items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">GigaChat</span>
                    <select
                      value={conversation.model}
                      onChange={(event) => setModel(event.target.value)}
                      className="select-glass"
                    >
                      <option>Qwen3-8B Q4_K_M</option>
                      <option>Qwen3-30B A3B</option>
                      <option>Llama 3.1 8B</option>
                    </select>
                  </div>
                  <Topbar />
                </div>
                <div className="composer-wrap">
                  <Composer
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    onStop={handleStop}
                    isStreaming={isStreaming}
                    onUploadClick={handleUploadClick}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  GigaChat có thể sai. Hãy kiểm tra lại thông tin quan trọng.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div ref={containerRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                  <MessageList
                    messages={conversation.messages}
                    onRegenerate={handleRegenerate}
                    onEdit={handleEdit}
                  />
                  {isStreaming && <TypingIndicator />}
                  <div ref={endRef} />
                </div>
              {showScroll && (
                <ScrollToBottomButton
                  onClick={scrollToBottom}
                  animate={scrollNudge}
                />
              )}

              <div className="mt-4 pb-6">
                <Composer
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  onStop={handleStop}
                  isStreaming={isStreaming}
                  onUploadClick={handleUploadClick}
                />
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  GigaChat có thể sai. Hãy kiểm tra lại thông tin quan trọng.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
