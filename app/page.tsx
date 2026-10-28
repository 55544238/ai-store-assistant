
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const stats = [
  { label: "Products", value: "Manage", icon: "📦", href: "/products" },
  { label: "Inventory", value: "Manage stock", icon: "📊", href: "/inventory" },
  { label: "Messages", value: "View messages", icon: "💬", href: "/messages" },
  { label: "Sales", value: "Coming soon", icon: "💰", href: null },
];

const navigation = [
  { label: "Overview", icon: "▦", href: "/" },
  { label: "Products", icon: "📦", href: "/products" },
  { label: "Inventory", icon: "📊", href: "/inventory" },
  { label: "Messages", icon: "💬", href: "/messages" },
  { label: "AI Assistant", icon: "🤖", href: "/chat" },
  { label: "Settings", icon: "⚙️", href: "/settings" },
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

    void checkLogin();

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

        <nav className="space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main menu
          </p>

          {navigation.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                item.href === "/"
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={logout}
            className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div>
            <h1 className="text-xl font-bold">Overview</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your store from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 md:hidden"
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
                type="button"
                onClick={() => {
                  if (stat.href) {
                    router.push(stat.href);
                  } else {
                    alert(`${stat.label} is not available yet.`);
                  }
                }}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
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
                    Manage products, prices, and inventory.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Add products, update prices, manage sizes and colors, and keep
                stock information up to date.
              </p>

              <button
                type="button"
                onClick={() => router.push("/products")}
                className="mt-6 w-full cursor-pointer rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View products →
              </button>

              <button
                type="button"
                onClick={() => router.push("/products/new")}
                className="mt-3 w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
              >
                + Add a product
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
                Test product questions and help customers get accurate
                information from your catalogue.
              </p>

              <button
                type="button"
                onClick={() => router.push("/chat")}
                className="mt-6 w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50"
              >
                Open AI assistant →
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Ready to test a customer question?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ask your AI assistant about a product, size, price, or stock
                availability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-4 shrink-0 cursor-pointer rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 sm:mt-0"
            >
              Try it now →
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
