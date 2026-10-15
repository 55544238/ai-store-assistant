"use client";

import { useRouter } from "next/navigation";

const stats = [
  { label: "Products", value: "Manage", icon: "📦", href: "/products" },
  { label: "Messages", value: "Coming soon", icon: "💬", href: null },
  { label: "Orders", value: "Coming soon", icon: "🛍️", href: null },
  { label: "Sales", value: "Coming soon", icon: "💰", href: null },
];

export default function Home() {
  const router = useRouter();

  function navigate(href: string | null, label: string) {
    if (href) {
      router.push(href);
    } else {
      alert(`${label} page is not connected yet. We'll build it next!`);
    }
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
              className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium"
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
          </div>

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Settings
          </p>

          <button
            onClick={() => router.push("/settings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <span>⚙️</span> Settings
          </button>
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold">Connect Instagram</p>
          <p className="mt-1 text-xs text-slate-500">
            Connect your store to start receiving customer messages.
          </p>
          <button
            onClick={() => router.push("/settings")}
            className="mt-3 w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Connect
          </button>
        </div>
      </aside>

      <main className="md:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm text-slate-500">Store Dashboard</p>
          <div className="flex items-center gap-3">
            <span>🔔</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              K
            </div>
            <span className="hidden text-sm font-medium sm:block">
              My Store
            </span>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your products and AI sales assistant.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => navigate(stat.href, stat.label)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-slate-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {stat.label}
                  </span>
                  <span>{stat.icon}</span>
                </div>
                <p className="mt-4 text-lg font-bold">{stat.value}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-semibold">Products</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage the products your AI assistant can sell.
                </p>
              </div>
              <button
                onClick={() => router.push("/products/new")}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                + Add Product
              </button>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                📦
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Manage your catalogue
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                View your existing products, update prices and stock, and add
                product photos.
              </p>
              <button
                onClick={() => router.push("/products")}
                className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                View All Products
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg text-white">
                AI
              </div>
              <div>
                <h2 className="font-semibold">Your AI Sales Assistant</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  We're preparing your assistant to answer customer questions
                  using your real product catalogue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}