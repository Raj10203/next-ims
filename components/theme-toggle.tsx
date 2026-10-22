"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, themeColors, type Theme } from "@/lib/theme";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

// The browser bar's theme-color metas carry media queries, so on their own
// they follow the OS; an explicit choice overrides both.
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;

  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      const scheme = meta.media.includes("dark") ? "dark" : "light";
      meta.content = themeColors[theme === "system" ? scheme : theme];
    });
}

function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  applyTheme(theme);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
    applyTheme(readTheme());
    notify();
  };
  listeners.add(notify);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

const options: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system");

  // Sets the browser bar and survives the dev Strict Mode remount of <html>.
  // Reads storage, not `theme`: while hydrating, `theme` is the server
  // snapshot ("system") and would undo the inline script.
  useLayoutEffect(() => applyTheme(readTheme()), []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex rounded-lg border border-border bg-surface p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={theme === option.value}
          title={option.label}
          onClick={() => setTheme(option.value)}
          className="flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground aria-pressed:bg-surface-muted aria-pressed:text-foreground"
        >
          <option.icon aria-hidden="true" className="size-5" />
        </button>
      ))}
    </div>
  );
}
