"use client";

import { useEffect, useState } from "react";
import { Switch } from "@heroui/react";

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
    <Switch
      size="sm"
      color="primary"
      isSelected={isDark}
      onValueChange={setIsDark}
      aria-label="Toggle dark mode"
      className="ml-3"
    >
      Dark
    </Switch>
  );
}

