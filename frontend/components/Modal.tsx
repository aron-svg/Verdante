"use client";

import React from "react";

export function Modal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={props.onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{props.title}</div>
            <div className="mt-1 h-px w-full bg-zinc-200" />
          </div>
          <button
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4">{props.children}</div>
      </div>
    </div>
  );
}
