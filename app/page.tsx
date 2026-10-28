
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const stats = [
  { label: "Products", value: "Manage", icon: "📦", href: "/products" },
  { label: "Messages", value: "Coming soon", icon: "💬", href: null },
  { label: "Orders", value: "Coming soon", icon: "🛍️", href: null },
  { label: "Sales", value: "Coming soon", icon: "💰", href: null },
];

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkLogin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session) {
        router.replace("/login");
      } else {
        setCheckingAuth(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  function navigate(href: string | null, label: string) {
    if (href) {
      router.push(href);
    } else {
      alert(`${label} page is not connected yet. We'll build it next!`);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Could not log out. Please try again.");
      return;
    }

    router.replace("/login");
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Checking your login...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white md:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              AI
            </div>
            <span className="text-lg font-bold">Store Assistant</span>
          </div>
        </div>

        <nav className="p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main
          </p>

          <div className="space-y-1">
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium hover:bg-slate-200"
            >
              <span>▦</span> Overview
            </button>

            <button
              onClick={() => router.push("/products")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>📦</span> Products
            </button>

            <button
              onClick={() => navigate(null, "Inventory")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>📊</span> Inventory
            </button>

            <button
              onClick={() => navigate(null, "Messages")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>💬</span> Messages
            </button>

            <button
              onClick={() => navigate(null, "Orders")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>🛍️</span> Orders
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>⚙️</span> Settings
            </button>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
          <button
            onClick={logout}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your store from one place.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 md:hidden"
          >
            Log out
          </button>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-8">
          <section>
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="mt-2 text-slate-500">
              Your AI-powered store assistant workspace.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => navigate(stat.href, stat.label)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </span>
                  <span className="text-2xl">{stat.icon}</span>
                </div>

                <p className="mt-5 text-lg font-semibold">{stat.value}</p>

                <p className="mt-1 text-xs text-slate-400">
                  {stat.href ? "Open and manage" : "Not connected yet"}
                </p>
              </button>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                  📦
                </div>
                <div>
                  <h3 className="font-semibold">Product catalogue</h3>
                  <p className="text-sm text-slate-500">
                    Manage your products and inventory.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Add products, update prices, manage sizes and colors, and keep
                your stock information up to date.
              </p>

              <button
                onClick={() => router.push("/products")}
                className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View products →
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold">AI Sales Assistant</h3>
                  <p className="text-sm text-slate-500">
                    Help customers find the right products.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Your assistant can help answer product questions using your
                catalogue. Keep product prices and stock accurate so customers
                receive reliable information.
              </p>

              <button
                onClick={() => router.push("/chat")}
                className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
              >
                Open AI assistant →
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Getting started</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Start by adding your products and their available sizes, colors,
              prices, and stock quantities. You can connect more sales channels
              as the assistant develops.
            </p>

            <button
              onClick={() => router.push("/products")}
              className="mt-4 cursor-pointer text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-600"
            >
              Set up your catalogue
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
