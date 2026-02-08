"use client";

import { useRef } from "react";
import { AppState } from "@/lib/types";
import { downloadJson, readJsonFile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { UIModeSwitch } from "@/components/UIModeSwitch";
import type { UIMode } from "@/lib/uiMode";

export function TopBar(props: {
  state: AppState;
  setState: (s: AppState) => void;
  titleRight?: string;
  onCreateProject: () => void;
  onUiModeChange?: (m: UIMode) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="no-print sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-green" />
              <UIModeSwitch onChange={props.onUiModeChange} />
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm text-zinc-600">
                {props.state.workspace.name} • Local-only MVP
              </div>
              <div className="truncate text-base font-semibold text-black">
                Carbon-Aware Cloud Computing {props.titleRight ? `— ${props.titleRight}` : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => downloadJson("carbon-aware-export.json", props.state)}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Export JSON
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const imported = (await readJsonFile(f)) as AppState;
              if (!imported || imported.version !== 1) {
                alert("Invalid import file (expected version 1).");
                return;
              }
              props.setState(imported);
              if (fileRef.current) fileRef.current.value = "";
              router.push("/dashboard");
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Import JSON
          </button>

          <button
            onClick={props.onCreateProject}
            className="rounded-xl bg-gradient-to-r from-emerald-700 to-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
