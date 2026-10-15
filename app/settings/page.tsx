
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

type StoreSettings = {
  name: string;
  instagram_username: string;
  currency: string;
  description: string;
};

const EMPTY_SETTINGS: StoreSettings = {
  name: "",
  instagram_username: "",
  currency: "USD",
  description: "",
};

function SectionIcon({
  type,
}: {
  type: "store" | "instagram" | "ai";
}) {
  if (type === "store") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M3 10.5 5 4h14l2 6.5M4.5 10v10h15V10M9 20v-6h6v6M3 10.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="17.5" cy="6.8" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 3 14 8l5 2-5 2-2 5-2-5-5-2 5-2 2-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m19 15 1.2 2.8L23 19l-2.8 1.2L19 23l-1.2-2.8L15 19l2.8-1.2L19 15Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] =
    useState<StoreSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const { data, error: loadError } = await supabase
          .from("stores")
          .select("name, instagram_username, currency, description")
          .eq("id", STORE_ID)
          .maybeSingle();

        if (loadError) {
          console.error("Could not load store settings:", loadError);
          setError(
            "We couldn't load your store information. Please check your connection and access permissions."
          );
          return;
        }

        if (!data) {
          setError(
            "Your store wasn't found. Please check the configured store ID and access permissions."
          );
          return;
        }

        setSettings({
          name: data.name ?? "",
          instagram_username: data.instagram_username ?? "",
          currency: data.currency ?? "USD",
          description: data.description ?? "",
        });
      } catch (err) {
        console.error("Unexpected settings loading error:", err);
        setError("Something went wrong while loading your store settings.");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  function updateField(field: keyof StoreSettings, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
    setSuccess("");
    setError("");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!settings.name.trim()) {
      setError("Please enter your store name.");
      return;
    }

    setSaving(true);

    try {
      const { data, error: saveError } = await supabase
        .from("stores")
        .update({
          name: settings.name.trim(),
          instagram_username:
            settings.instagram_username.trim().replace(/^@+/, "") || null,
          currency: settings.currency,
          description: settings.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", STORE_ID)
        .select("id")
        .maybeSingle();

      if (saveError) {
        console.error("Could not save store settings:", saveError);
        setError(
          "Your changes couldn't be saved. Please check your Supabase permissions and try again."
        );
        return;
      }

      if (!data) {
        setError(
          "No store was updated. Your account may not have permission to edit this store."
        );
        return;
      }

      setSettings((current) => ({
        ...current,
        instagram_username: current.instagram_username
          .trim()
          .replace(/^@+/, ""),
      }));

      setSuccess("Your store settings have been saved.");
    } catch (err) {
      console.error("Unexpected settings error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-[var(--foreground)]";

  const cardClass =
    "scroll-mt-28 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm";

  const secondaryPanelClass =
    "rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]";

  const mutedTextClass = "text-[var(--muted)]";
  const headingClass = "font-bold tracking-tight text-[var(--foreground)]";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-sm">
              <SectionIcon type="ai" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">
                AI Store Assistant
              </p>
              <p className={`mt-0.5 text-xs ${mutedTextClass}`}>
                Store management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface-secondary)] sm:px-4"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M15 18l-6-6 6-6M9 12h12"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <div className={`mb-3 flex items-center gap-2 text-xs font-semibold ${mutedTextClass}`}>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="transition hover:opacity-70"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-[var(--foreground)]">Settings</span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Settings
              </h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 sm:text-base ${mutedTextClass}`}>
                Manage your store profile, social channels, and AI assistant
                setup from one place.
              </p>
            </div>

            <div className={`inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium shadow-sm ${mutedTextClass}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Settings workspace
            </div>
          </div>
        </div>

        <nav className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm">
          <a
            href="#store-profile"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-[var(--background)]"
          >
            <SectionIcon type="store" />
            Store profile
          </a>
          <a
            href="#social-connections"
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] ${mutedTextClass}`}
          >
            <SectionIcon type="instagram" />
            Connections
          </a>
          <a
            href="#ai-assistant"
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] ${mutedTextClass}`}
          >
            <SectionIcon type="ai" />
            AI assistant
          </a>
        </nav>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
          >
            <span className="mt-0.5 font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <span className="font-bold">✓</span>
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
          <div className="min-w-0 space-y-6">
            <section id="store-profile" className={cardClass}>
              <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
                    <SectionIcon type="store" />
                  </div>
                  <div>
                    <h2 className={headingClass}>Store profile</h2>
                    <p className={`mt-1 text-sm ${mutedTextClass}`}>
                      Your store&apos;s public-facing information.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={saveSettings}>
                <div className="space-y-5 px-5 py-6 sm:px-7">
                  {loading ? (
                    <div className="space-y-5 py-2">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="animate-pulse">
                          <div className="mb-2 h-4 w-28 rounded bg-[var(--surface-secondary)]" />
                          <div className="h-12 rounded-xl bg-[var(--surface-secondary)]" />
                        </div>
                      ))}
                      <p className={`text-sm ${mutedTextClass}`}>
                        Loading your store information...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="store-name" className={labelClass}>
                          Store name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="store-name"
                          value={settings.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          required
                          maxLength={100}
                          className={inputClass}
                          placeholder="My Fashion Store"
                        />
                        <p className={`mt-2 text-xs ${mutedTextClass}`}>
                          Use the name customers recognize.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="instagram-username" className={labelClass}>
                          Instagram username
                        </label>
                        <div className="flex items-center rounded-xl border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10">
                          <span className={`pl-4 text-sm font-medium ${mutedTextClass}`}>
                            @
                          </span>
                          <input
                            id="instagram-username"
                            value={settings.instagram_username}
                            onChange={(e) =>
                              updateField(
                                "instagram_username",
                                e.target.value.replace(/^@+/, "")
                              )
                            }
                            maxLength={100}
                            className="w-full rounded-xl bg-transparent px-2 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                            placeholder="yourstore"
                          />
                        </div>
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          This saves the username only. It does not connect
                          your Instagram account or authorize messaging.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="currency" className={labelClass}>
                          Default currency
                        </label>
                        <select
                          id="currency"
                          value={settings.currency}
                          onChange={(e) => updateField("currency", e.target.value)}
                          className={inputClass}
                        >
                          <option value="USD">USD — US Dollar</option>
                          <option value="RWF">RWF — Rwandan Franc</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="EUR">EUR — Euro</option>
                        </select>
                        <p className={`mt-2 text-xs ${mutedTextClass}`}>
                          Choose the currency you use for your store.
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label htmlFor="description" className={labelClass.replace("mb-2 ", "")}>
                            Store description
                          </label>
                          <span className={`text-xs ${mutedTextClass}`}>
                            {settings.description.length}/1000
                          </span>
                        </div>
                        <textarea
                          id="description"
                          value={settings.description}
                          onChange={(e) => updateField("description", e.target.value)}
                          rows={4}
                          maxLength={1000}
                          className={`${inputClass} resize-y leading-6`}
                          placeholder="Tell customers about your clothing, shoes, and accessories..."
                        />
                        <p className={`mt-2 text-xs ${mutedTextClass}`}>
                          A short description helps explain what your store offers.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                  <p className={`text-sm ${mutedTextClass}`}>
                    Your changes are saved to your store in Supabase.
                  </p>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] shadow-sm transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <path
                            d="M5 3h12l4 4v14H3V3h2ZM7 3v6h10V3M7 21v-7h10v7"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section id="ai-assistant" className={cardClass}>
              <div className="flex items-start gap-4 p-5 sm:p-7">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                  <SectionIcon type="ai" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={headingClass}>AI assistant</h2>
                    <span className={`rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-semibold ${mutedTextClass}`}>
                      Catalog enabled
                    </span>
                  </div>

                  <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>
                    Your assistant uses your product catalog to answer
                    questions about products, prices, sizes, colors, and
                    availability.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={secondaryPanelClass + " p-4"}>
                      <p className={`text-xs font-medium ${mutedTextClass}`}>
                        AI provider
                      </p>
                      <p className="mt-1.5 text-sm font-bold">Groq</p>
                    </div>
                    <div className={secondaryPanelClass + " p-4"}>
                      <p className={`text-xs font-medium ${mutedTextClass}`}>
                        Product data
                      </p>
                      <p className="mt-1.5 text-sm font-bold">Supabase</p>
                    </div>
                  </div>

                  <p className={`mt-4 text-xs leading-5 ${mutedTextClass}`}>
                    Language and response-behavior preferences are not
                    configurable from this page yet.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/chat")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface-secondary)]"
                  >
                    Open AI chat
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path
                        d="M5 12h14m-6-6 6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-6">
            <section id="social-connections" className={cardClass}>
              <div className="border-b border-[var(--border)] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-100 via-pink-100 to-orange-100 text-pink-700">
                    <SectionIcon type="instagram" />
                  </div>
                  <div>
                    <h2 className={headingClass}>Social connections</h2>
                    <p className={`mt-1 text-xs ${mutedTextClass}`}>
                      Connect your customer channels
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Instagram Messaging</p>
                    <p className={`mt-1 text-xs ${mutedTextClass}`}>
                      AI replies to customer DMs
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Needs testing
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-2.5">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M12 7v5m0 4h.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Connection not confirmed
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">
                        Webhook verification alone doesn&apos;t confirm that
                        customer messages receive replies.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>
                    Before going live
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Keep your app server and public webhook running.",
                      "Verify webhook subscriptions in Meta Developers.",
                      "Test a real DM from another Instagram account.",
                      "Confirm messaging permissions and access token.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[10px] ${mutedTextClass}`}>
                          ✓
                        </span>
                        <span className={`text-xs leading-5 ${mutedTextClass}`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-80"
                >
                  Return to dashboard
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </section>

            <section className={cardClass + " p-5 sm:p-6"}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path
                      d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-bold">
                  Keep your catalog updated
                </h3>
              </div>
              <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>
                Your AI assistant relies on product data to answer customers
                accurately. Update stock, prices, sizes, and colors whenever
                they change.
              </p>
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="mt-4 text-sm font-semibold underline decoration-[var(--border)] underline-offset-4 transition hover:opacity-70"
              >
                Manage products
              </button>
            </section>
          </aside>
        </div>

        <footer className={`mt-10 border-t border-[var(--border)] pt-6 text-center text-xs ${mutedTextClass}`}>
          AI Store Assistant · Store settings
        </footer>
      </main>
    </div>
  );
}
