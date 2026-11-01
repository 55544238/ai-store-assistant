
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  store_id: string;
  role: string;
  content: string;
  created_at: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getConversationTitle(conversation: Conversation) {
  return conversation.title?.trim() || "New conversation";
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("chat_conversations")
          .select("id, title, created_at, updated_at")
          .eq("store_id", STORE_ID)
          .order("updated_at", { ascending: false });

      if (conversationError) throw conversationError;

      const loadedConversations =
        (conversationData as Conversation[] | null) ?? [];

      setConversations(loadedConversations);

      setSelectedId((currentId) => {
        if (
          currentId &&
          loadedConversations.some((conversation) => conversation.id === currentId)
        ) {
          return currentId;
        }

        return loadedConversations[0]?.id ?? null;
      });

      if (loadedConversations.length === 0) {
        setMessages([]);
        return;
      }

      const conversationIds = loadedConversations.map(
        (conversation) => conversation.id
      );

      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .select("id, conversation_id, store_id, role, content, created_at")
        .eq("store_id", STORE_ID)
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true })
        .limit(1000);

      if (messageError) throw messageError;

      setMessages((messageData as ChatMessage[] | null) ?? []);
    } catch (err) {
      console.error("Load messages error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading messages.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation).toLowerCase();

      const lastMessage = messages
        .filter((message) => message.conversation_id === conversation.id)
        .at(-1);

      return (
        title.includes(query) ||
        (lastMessage?.content ?? "").toLowerCase().includes(query)
      );
    });
  }, [conversations, messages, search]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const selectedMessages = messages.filter(
    (message) => message.conversation_id === selectedId
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <span aria-hidden="true">←</span>
              Back to Overview
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Messages
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              View conversations from your website AI assistant.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadMessages()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">↻</span>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Total conversations
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {conversations.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Messages loaded
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {messages.length}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
          >
            <p className="font-semibold">Could not load messages</p>
            <p className="mt-1 break-words">{error}</p>
            <p className="mt-2 text-red-800">
              Check your Supabase connection and access permissions. No database
              changes have been made by this page.
            </p>
          </div>
        )}

        <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900">
                Conversations
              </h2>

              <div className="relative mt-3">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-2.5 text-slate-500"
                >
                  ⌕
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  aria-label="Search conversations"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="max-h-[620px] overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <p className="p-5 text-sm text-slate-600">
                  Loading conversations...
                </p>
              ) : filteredConversations.length === 0 ? (
                <div className="p-5">
                  <p className="text-sm font-medium text-slate-800">
                    No conversations found
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {search
                      ? "Try another search term."
                      : "Website AI conversations will appear here when available."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const conversationMessages = messages.filter(
                    (message) => message.conversation_id === conversation.id
                  );

                  const lastMessage = conversationMessages.at(-1);
                  const isSelected = selectedId === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                        isSelected
                          ? "border-l-4 border-l-blue-600 bg-blue-50"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                          {getConversationTitle(conversation)}
                        </p>
                        <span className="shrink-0 text-xs text-slate-500">
                          {conversationMessages.length}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-600">
                        {lastMessage?.content || "No messages yet"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(conversation.updated_at)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col">
            {selectedConversation ? (
              <>
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="truncate font-semibold text-slate-900">
                    {getConversationTitle(selectedConversation)}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Last updated{" "}
                    {formatDate(selectedConversation.updated_at)}
                  </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
                  {selectedMessages.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                      <p className="font-medium text-slate-800">
                        No messages in this conversation
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Messages will appear here when available.
                      </p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => {
                      const isAssistant =
                        message.role.toLowerCase() === "assistant";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isAssistant ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[80%] ${
                              isAssistant
                                ? "border border-slate-200 bg-white text-slate-900"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            <p
                              className={`mb-1 text-xs font-semibold ${
                                isAssistant
                                  ? "text-slate-600"
                                  : "text-blue-100"
                              }`}
                            >
                              {isAssistant
                                ? "AI Assistant"
                                : message.role.toLowerCase() === "user"
                                  ? "Customer"
                                  : message.role}
                            </p>

                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.content}
                            </p>

                            <p
                              className={`mt-2 text-xs ${
                                isAssistant
                                  ? "text-slate-500"
                                  : "text-blue-100"
                              }`}
                            >
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <div
                    aria-hidden="true"
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600"
                  >
                    ✉
                  </div>
                  <h2 className="font-semibold text-slate-900">
                    Select a conversation
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose a conversation from the list to read its messages.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-600">
          This page displays existing website AI chats. Instagram customer
          messages will be connected separately after the inbox is verified.
        </p>
      </div>
    </main>
  );
}
