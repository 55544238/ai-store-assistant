
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      setMessage("Login successful! Opening your dashboard...");

      router.replace("/");
      router.refresh();
    } catch {
      setError(
        "Unable to log in right now. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-3xl text-white">
            🛍️
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            AI Store Assistant
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Manage your products and let AI help you sell.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lg sm:p-8">
          <h2 className="text-2xl font-bold text-slate-950">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your store dashboard.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-black focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-black focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account yet?
            </p>

            <Link
              href="/signup"
              className="mt-2 inline-block font-semibold text-slate-950 underline underline-offset-4 transition hover:text-slate-600"
            >
              Create an account
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure sign-in powered by Supabase.
        </p>
      </div>
    </main>
  );
}
