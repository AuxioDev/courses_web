"use client";

import { useSyncExternalStore } from "react";

const KEY = "web:theme";
type Theme = "light" | "dark";

// The choice is stored in this browser; with none the site is light.
function read(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    if (value === "light" || value === "dark") return value;
  } catch {}
  // The website opens light; dark is only ever a choice made with this switch.
  return "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function choose(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  // The same attribute the script in the root layout sets before the first paint.
  document.documentElement.setAttribute("data-theme", theme);
  // Tells every other control that shows the theme (such as the one in Profile) to read it again.
  window.dispatchEvent(new Event("storage"));
}

// Light/dark switch that sits next to the language menu. It shows the theme you would switch to.
export function ThemeToggle({ labels }: { labels: { theme: string; dark: string } }) {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={`${labels.theme}: ${labels.dark}`}
      title={`${labels.theme}: ${labels.dark}`}
      onClick={() => choose(dark ? "light" : "dark")}
      className="theme-toggle"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
