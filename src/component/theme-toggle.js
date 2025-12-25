"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme");
      let nextDark = false;
      if (stored === "dark") nextDark = true;
      else if (stored === "light") nextDark = false;
      else nextDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(nextDark);
      document.documentElement.classList.toggle("dark", nextDark);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }, [isDark, mounted]);

  if (!mounted) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="다크 모드 토글"
      className="ml-3 gap-2"
      onClick={() => setIsDark((prev) => !prev)}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {isDark ? "Dark" : "Light"}
    </Button>
  );
}

