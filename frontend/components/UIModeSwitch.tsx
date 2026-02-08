"use client";

import { useEffect, useState } from "react";
import { loadUiMode, toggleUiMode, type UIMode } from "@/lib/uiMode";

export function UIModeSwitch(props: { className?: string; onChange?: (m: UIMode) => void } = {}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<UIMode>("LITE");

  useEffect(() => {
    setMounted(true);
    setMode(loadUiMode());
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const next = toggleUiMode(mode);
        setMode(next);
        props.onChange?.(next);
      }}
      className={[
        "rounded-xl border px-3 py-2 text-sm font-semibold",
        "border-zinc-300 bg-white hover:bg-zinc-50",
        props.className ?? "",
      ].join(" ")}
      title="Switch UI mode (Lite/Full)"
    >
      UI: {mode === "LITE" ? "Lite" : "Full"}
    </button>
  );
}
