export type UIMode = "LITE" | "FULL";

const KEY = "carbonAwareMvp:uiMode:v1";

export function loadUiMode(): UIMode {
  if (typeof window === "undefined") return "LITE";
  const raw = window.localStorage.getItem(KEY);
  if (raw === "LITE" || raw === "FULL") return raw;
  window.localStorage.setItem(KEY, "LITE");
  return "LITE";
}

export function saveUiMode(mode: UIMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
}

export function toggleUiMode(current: UIMode): UIMode {
  const next: UIMode = current === "LITE" ? "FULL" : "LITE";
  saveUiMode(next);
  return next;
}
