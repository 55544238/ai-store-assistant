
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type ProductVariant = {
  size: string | null;
  color: string | null;
  price: number | string | null;
  stock_quantity: number | null;
  in_stock?: boolean;
};

type ChatProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string | null;
  image_url: string | null;
  variants: ProductVariant[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: ChatProduct[];
};

type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

const WELCOME_MESSAGE =
  "Hi there! Welcome to your store assistant. I can help you explore products, compare prices, check sizes and colors, and find out what's in stock. What are you looking for today?";

const CONVERSATION_STORAGE_KEY = "ai-store-assistant-conversation-id";

const SUGGESTIONS = [
  {
    icon: "↗",
    title: "Explore products",
    prompt: "What products do you have available?",
  },
  {
    icon: "＄",
    title: "Check prices",
    prompt: "Can you show me your products and their prices?",
  },
  {
    icon: "□",
    title: "Check availability",
    prompt: "Which products are currently in stock?",
  },
  {
    icon: "↔",
    title: "Find my size",
    prompt: "What sizes do you have available?",
  },
];

function renderMessageContent(content: string) {
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  const parts: Array<
    | { type: "text"; value: string }
    | { type: "image"; alt: string; url: string }
  > = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "image",
      alt: match[1] || "Product photo",
      url: match[2],
    });

    lastIndex = imageRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  if (parts.length === 0) {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  return (
    <div className="space-y-3 break-words">
      {parts.map((part, index) =>
        part.type === "image" ? (
          <img
            key={index}
            src={part.url}
            alt={part.alt}
            loading="lazy"
            className="max-h-80 w-full rounded-xl bg-[var(--surface-secondary)] object-contain"
          />
        ) : (
          <p key={index} className="whitespace-pre-wrap break-words">
            {part.value}
          </p>
        )
      )}
    </div>
  );
}

function ProductCard({ product }: { product: ChatProduct }) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const sizes = [
    ...new Set(
      variants
        .map((variant) => variant.size)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  const colors = [
    ...new Set(
      variants
        .map((variant) => variant.color)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  const stock = variants.reduce(
    (total, variant) =>
      total + Math.max(0, Number(variant.stock_quantity) || 0),
    0
  );

  const hasStock = variants.some(
    (variant) => variant.stock_quantity !== null
  );

  const prices = [
    ...new Set(
      variants
        .map((variant) => variant.price)
        .filter(
          (price) => price !== null && price !== undefined && price !== ""
        )
        .map(String)
    ),
  ];

  const basePrice =
    product.price !== null &&
    product.price !== undefined &&
    product.price !== ""
      ? String(product.price)
      : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex h-48 items-center justify-center bg-[var(--surface-secondary)]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="text-xs text-[var(--muted)]">No product photo</span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          {product.category && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {product.category}
            </p>
          )}
          <h3 className="font-semibold text-[var(--foreground)]">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
              {product.description}
            </p>
          )}
        </div>

        <p className="text-sm font-semibold text-[var(--foreground)]">
          {prices.length > 0
            ? prices.length === 1
              ? `Price: ${prices[0]}`
              : `Variant prices: ${prices.join(", ")}`
            : basePrice !== null
              ? `Price: ${basePrice}`
              : "Price not listed"}
        </p>

        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <span
                key={size}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--muted)]"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {colors.length > 0 && (
          <p className="text-xs text-[var(--muted)]">
            Colors: {colors.join(", ")}
          </p>
        )}

        <div className="border-t border-[var(--border)] pt-3">
          {hasStock ? (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                stock > 0
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  stock > 0 ? "bg-emerald-500" : "bg-[var(--border)]"
                }`}
              />
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--muted)]">
              Stock not confirmed
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/history", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load chat history.");
      }

      setConversations(
        Array.isArray(data.conversations) ? data.conversations : []
      );
      setHistoryError("");
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Could not load chat history."
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreConversation() {
      setHistoryLoading(true);

      try {
        let savedId: string | null = null;

        try {
          savedId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
        } catch {
          // Continue with a fresh in-memory conversation if storage is blocked.
        }

        if (!savedId) {
          savedId = crypto.randomUUID();
          try {
            localStorage.setItem(CONVERSATION_STORAGE_KEY, savedId);
          } catch {
            // The ID still works for this page session.
          }
        }

        if (cancelled) return;
        setConversationId(savedId);

        const response = await fetch(
          `/api/chat/history?conversationId=${encodeURIComponent(savedId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not restore this conversation.");
        }

        if (cancelled) return;

        setConversations(
          Array.isArray(data.conversations) ? data.conversations : []
        );

        const restored: Message[] = Array.isArray(data.messages)
          ? data.messages
              .filter(
                (item: unknown) =>
                  Boolean(item) &&
                  typeof item === "object" &&
                  ((item as Message).role === "user" ||
                    (item as Message).role === "assistant") &&
                  typeof (item as Message).content === "string"
              )
              .map((item: Message) => ({
                role: item.role,
                content: item.content,
              }))
          : [];

        setMessages(
          restored.length > 0
            ? restored
            : [{ role: "assistant", content: WELCOME_MESSAGE }]
        );
      } catch (error) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Could not restore chat history."
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void restoreConversation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];

    if (last?.role === "user") {
      latestUserMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, loading]);

  async function openConversation(id: string) {
    if (loading || historyLoading) return;

    setHistoryLoading(true);
    setHistoryError("");
    setSidebarOpen(false);

    try {
      const response = await fetch(
        `/api/chat/history?conversationId=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not open this conversation.");
      }

      const restored: Message[] = Array.isArray(data.messages)
        ? data.messages
            .filter(
              (item: unknown) =>
                Boolean(item) &&
                typeof item === "object" &&
                ((item as Message).role === "user" ||
                  (item as Message).role === "assistant") &&
                typeof (item as Message).content === "string"
            )
            .map((item: Message) => ({
              role: item.role,
              content: item.content,
            }))
        : [];

      setConversationId(id);

      try {
        localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
      } catch {
        // Keep the selected ID in React state.
      }

      setMessages(
        restored.length > 0
          ? restored
          : [{ role: "assistant", content: WELCOME_MESSAGE }]
      );
      setConversations(
        Array.isArray(data.conversations) ? data.conversations : conversations
      );
      setInput("");
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Could not open conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function sendMessage(messageText: string) {
    const trimmed = messageText.trim();

    if (!trimmed || loading || historyLoading) return;

    if (!conversationId) {
      setHistoryError("Your conversation is still loading. Please try again.");
      return;
    }

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          messages: updatedMessages.slice(1).slice(-20),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The assistant could not respond. Please try again."
        );
      }

      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "I couldn't generate a response. Please try again.";

      const products: ChatProduct[] = Array.isArray(data.products)
        ? data.products.filter((product: unknown): product is ChatProduct => {
            if (!product || typeof product !== "object") return false;
            const item = product as Partial<ChatProduct>;
            return typeof item.id === "string" && typeof item.name === "string";
          })
        : [];

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply, products },
      ]);

      await refreshConversations();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Sorry, I couldn't complete that request. ${
            error instanceof Error ? error.message : "Please try again."
          }`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function startNewChat() {
    if (
      messages.length > 1 &&
      !window.confirm(
        "Start a new conversation? Your saved chat will remain in history."
      )
    ) {
      return;
    }

    const newId = crypto.randomUUID();

    try {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, newId);
    } catch {
      // The ID remains in component state.
    }

    setConversationId(newId);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setInput("");
    setHistoryError("");
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  const showWelcome = messages.length === 1;
  const activeConversation = conversations.find(
    (item) => item.id === conversationId
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] md:h-screen md:overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close conversation sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div className="flex min-h-screen md:h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface-secondary)] transition-transform duration-200 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 px-5 pb-5 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M6 8h12l1 13H5L6 8Z M9 8a3 3 0 0 1 6 0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">
                AI Store Assistant
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Fashion commerce
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="ml-auto rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--border)] md:hidden"
            >
              ✕
            </button>
          </div>

          <div className="px-3">
            <button
              type="button"
              onClick={startNewChat}
              disabled={loading || historyLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-80 disabled:opacity-50"
            >
              <span className="text-lg leading-none">+</span>
              New chat
            </button>
          </div>

          <div className="mt-8 flex-1 overflow-y-auto px-3">
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Recent conversations
            </p>

            {historyLoading && conversations.length === 0 ? (
              <p className="px-3 py-3 text-xs text-[var(--muted)]">
                Loading history…
              </p>
            ) : conversations.length === 0 ? (
              <p className="px-3 py-3 text-xs leading-5 text-[var(--muted)]">
                Your saved chats will appear here after your first message.
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => {
                  const active = conversation.id === conversationId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      disabled={loading || historyLoading}
                      onClick={() => void openConversation(conversation.id)}
                      className={`group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition disabled:opacity-50 ${
                        active
                          ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm ring-1 ring-[var(--border)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5A7.5 7.5 0 0 1 10.5 4H12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M15 4h6m-3-3v6" strokeLinecap="round" />
                      </svg>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {conversation.title || "New conversation"}
                        </span>
                        <span className="mt-1 block text-[10px] text-[var(--muted)]">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {historyError && (
              <p className="mx-2 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-600 dark:text-red-300">
                {historyError}
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <a
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to dashboard
            </a>
            <p className="px-3 pt-2 text-[10px] text-[var(--muted)]">
              AI Store Assistant · 2026
            </p>
          </div>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-1 flex-col bg-[var(--background)] md:h-screen md:min-h-0">
          <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open conversation sidebar"
                className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface-secondary)] md:hidden"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight">
                  {activeConversation?.title || "Shopping assistant"}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected to your store catalog
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              disabled={loading || historyLoading}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:bg-[var(--surface-secondary)] disabled:opacity-50 sm:hidden"
            >
              <span>+</span> New
            </button>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-[var(--muted)]">
                English · Français · Kinyarwanda
              </span>
              <button
                type="button"
                onClick={startNewChat}
                disabled={loading || historyLoading}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:bg-[var(--surface-secondary)] disabled:opacity-50"
              >
                + New chat
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
              {historyLoading && (
                <div className="mb-5 text-center text-xs text-[var(--muted)]">
                  Restoring your conversation…
                </div>
              )}

              {showWelcome && !historyLoading && (
                <div className="flex min-h-[55vh] flex-col items-center justify-center py-10 text-center">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 8h12l1 13H5L6 8Z M9 8a3 3 0 0 1 6 0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Your personal shopping assistant
                  </p>
                  <h2 className="max-w-lg text-3xl font-medium tracking-tight sm:text-4xl">
                    Find something
                    <br />
                    <span className="text-[var(--muted)]">
                      you&apos;ll love.
                    </span>
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Explore the collection, compare prices, and check sizes
                    and availability using your store&apos;s real catalog.
                  </p>

                  <div className="mt-9 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.title}
                        type="button"
                        disabled={loading || historyLoading || !conversationId}
                        onClick={() => void sendMessage(suggestion.prompt)}
                        className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-sm transition">
                          {suggestion.icon}
                        </span>
                        <span>
                          <span className="block text-xs font-semibold">
                            {suggestion.title}
                          </span>
                          <span className="mt-1 block text-[11px] leading-5 text-[var(--muted)]">
                            {suggestion.prompt}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {messages.map((message, index) => (
                  <div
                    key={`${conversationId}-${index}-${message.role}`}
                    ref={
                      message.role === "user" && index === messages.length - 1
                        ? latestUserMessageRef
                        : undefined
                    }
                    className={`flex items-start gap-3 sm:gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-xs text-[var(--background)]">
                        AI
                      </div>
                    )}

                    <div
                      className={`min-w-0 ${
                        message.role === "user"
                          ? "max-w-[88%] sm:max-w-[78%]"
                          : "max-w-[92%] flex-1 sm:max-w-[86%]"
                      }`}
                    >
                      <p
                        className={`mb-2 text-[10px] font-medium uppercase tracking-[0.13em] text-[var(--muted)] ${
                          message.role === "user" ? "text-right" : ""
                        }`}
                      >
                        {message.role === "user" ? "You" : "Store assistant"}
                      </p>

                      <div
                        className={`text-sm leading-7 ${
                          message.role === "user"
                            ? "rounded-2xl rounded-tr-sm bg-[var(--foreground)] px-4 py-3 text-[var(--background)] sm:px-5"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {renderMessageContent(message.content)}
                      </div>

                      {message.role === "assistant" &&
                        message.products &&
                        message.products.length > 0 && (
                          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {message.products.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-xs text-[var(--background)]">
                      AI
                    </div>
                    <div className="pt-1">
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.13em] text-[var(--muted)]">
                        Store assistant
                      </p>
                      <div className="flex items-center gap-1.5 py-2">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" />
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          Checking the catalog…
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] px-4 pb-4 pt-4 sm:px-8 sm:pb-5">
            <div className="mx-auto max-w-3xl">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 pl-4 shadow-sm transition focus-within:border-[var(--muted)] focus-within:shadow-md"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about products, prices, sizes…"
                  maxLength={2000}
                  disabled={loading || historyLoading || !conversationId}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed"
                  aria-label="Your message"
                />
                <button
                  type="submit"
                  disabled={
                    loading ||
                    historyLoading ||
                    !input.trim() ||
                    !conversationId
                  }
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 19V5m-6 6 6-6 6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <p className="mt-3 text-center text-[10px] leading-5 text-[var(--muted)]">
                AI can make mistakes. Confirm product details with your store
                catalog.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
