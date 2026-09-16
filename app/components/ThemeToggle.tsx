"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  THEME_CHANGED_EVENT,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/app/lib/theme";

function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme, persist = true) {
  document.documentElement.dataset.theme = theme;

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The current page still changes theme when storage is unavailable.
    }
  }

  window.dispatchEvent(
    new CustomEvent<{ theme: Theme }>(THEME_CHANGED_EVENT, {
      detail: { theme },
    }),
  );
}

function subscribeToTheme(onStoreChange: () => void) {
  const handleThemeChange = () => onStoreChange();

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    document.documentElement.dataset.theme =
      event.newValue === "light" ? "light" : "dark";
    onStoreChange();
  };

  window.addEventListener(THEME_CHANGED_EVENT, handleThemeChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getCurrentTheme,
    () => "dark",
  );

  useLayoutEffect(() => {
    let savedTheme: Theme = "dark";

    try {
      savedTheme =
        window.localStorage.getItem(THEME_STORAGE_KEY) === "light"
          ? "light"
          : "dark";
    } catch {
      // Dark remains the default when storage is unavailable.
    }

    applyTheme(savedTheme, false);
  }, []);

  const options: Array<{ theme: Theme; icon: string; label: string }> = [
    { theme: "light", icon: "☀", label: "Light" },
    { theme: "dark", icon: "☾", label: "Dark" },
  ];

  return (
    <div
      className={
        compact
          ? "rounded-control border border-border bg-surface-muted p-1"
          : "rounded-control border border-border bg-background p-2"
      }
    >
      {!compact && (
        <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Appearance
        </p>
      )}
      <div className="grid grid-cols-2 gap-1" role="group" aria-label="Color theme">
        {options.map((option) => {
          const active = theme === option.theme;
          return (
            <button
              key={option.theme}
              type="button"
              aria-pressed={active}
              aria-label={`Use ${option.label.toLowerCase()} theme`}
              title={`${option.label} theme`}
              onClick={() => applyTheme(option.theme)}
              className={`theme-option theme-option-${option.theme} inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-bold text-muted transition hover:bg-surface/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {option.icon}
              </span>
              <span className={compact ? "sr-only" : ""}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
