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

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">
          Checking your login...
        </p>
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
