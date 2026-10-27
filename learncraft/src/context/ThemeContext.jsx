import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

const ThemeContext = createContext(null);

const STORAGE_KEY = "learncraft_theme";

function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  // preference: 'system' | 'light' | 'dark'
  const [themePreference, setThemePreferenceState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    }
    return "system";
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Resolved active theme ('light' or 'dark')
  const resolvedTheme = themePreference === "system" ? systemTheme : themePreference;

  // Listen to OS theme changes when in system mode
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Synchronize document DOM attributes whenever resolvedTheme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme) => {
    if (newTheme !== "system" && newTheme !== "light" && newTheme !== "dark") return;
    setThemePreferenceState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }

    // Attempt to persist to user profile if logged in
    authApi.updateProfile({ themePreference: newTheme }).catch(() => {
      // Non-blocking if offline or unauthenticated
    });
  };

  const value = {
    theme: themePreference,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    setTheme,
    toggleTheme: () => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
