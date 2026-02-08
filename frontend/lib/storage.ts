import { AppState } from "./types";
import { makeSeedState } from "./seed";

const KEY = "carbonAwareMvp:v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return makeSeedState();

  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const seed = makeSeedState();
    window.localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1) throw new Error("bad version");
    return parsed;
  } catch {
    const seed = makeSeedState();
    window.localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
