"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Overview", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Inventory", href: "/inventory" },
  { name: "Messages", href: "/messages" },
  { name: "AI Assistant", href: "/chat" },
  { name: "Settings", href: "/settings" },
];

export default function DashboardLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-indigo-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            AI Store Assistant
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            Your store, made smarter
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800">
          AI-powered selling for your store
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(true)}
            >
              Menu
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">
                {title || "AI Store Assistant"}
              </h1>
              {description && (
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
          </div>

          <Link
            href="/products"
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Add product
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
