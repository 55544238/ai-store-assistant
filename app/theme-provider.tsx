
"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ai-store-assistant-theme");
    const isDark = saved === "dark";

    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;

    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem(
      "ai-store-assistant-theme",
      nextDark ? "dark" : "light"
    );
  }

  return (
    <>
      {children}

      <button
        type="button"
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-[100] rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-lg hover:opacity-80"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? "☀️ Light mode" : "🌙 Dark mode"}
      </button>
    </>
  );
}
