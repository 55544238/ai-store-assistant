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
        </div
