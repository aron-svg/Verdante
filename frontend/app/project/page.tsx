"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import type {
  AppState,
  CompliancePolicy,
  LitePreset,
  OptimizationProfile,
  Project,
  ReportingRegime,
} from "@/lib/types";
import { makeSeedState } from "@/lib/seed";
import { loadState, saveState, uid } from "@/lib/storage";
import { loadUiMode, type UIMode } from "@/lib/uiMode";

function cls(...x: Array<string | false | null | undefined>) {
  return x.filter(Boolean).join(" ");
}

function parseTags(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Used to render a filled green track (same green vibe as your buttons).
function sliderBg(percent: number) {
  const p = Math.max(0, Math.min(100, percent));
  return `linear-gradient(to right, #047857 0%, #047857 ${p}%, #d1fae5 ${p}%, #d1fae5 100%)`;
}

export default function ProjectPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [state, setState] = useState<AppState>(() => makeSeedState());
  const [hydrated, setHydrated] = useState(false);

  const [uiMode, setUiMode] = useState<UIMode>("LITE");

  useEffect(() => {
    const s = loadState();
    setState(s);
    setUiMode(loadUiMode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const projectIdFromUrl = sp.get("projectId") ?? "";

  const projectIndex = useMemo(() => {
    const id = projectIdFromUrl || state.projects[0]?.id || "";
    return state.projects.findIndex((p) => p.id === id);
  }, [state.projects, projectIdFromUrl]);

  const project: Project | null =
    projectIndex >= 0 ? state.projects[projectIndex] : state.projects[0] ?? null;

  function patchProject(patch: Partial<Project>) {
    if (!project) return;
    const nextProjects = state.projects.slice();
    const idx = projectIndex >= 0 ? projectIndex : 0;
    nextProjects[idx] = { ...project, ...patch };
    setState({ ...state, projects: nextProjects });
  }

  function updateCompliance(patch: Partial<CompliancePolicy>) {
    if (!project) return;
    patchProject({ compliance: { ...project.compliance, ...patch } });
  }

  function setProjectProfile(next: OptimizationProfile) {
    if (!project) return;
    patchProject({ profile: next });
  }

  function createProject() {
    const p: Project = {
      id: uid("proj"),
      name: "New Project",
      description: "",
      tags: [],
      reportingRegime: state.defaults.defaultReportingRegime,
      profile: state.defaults.defaultProfile,
      compliance: state.defaults.defaultCompliance,
      jobs: [],
    };

    setState({
      ...state,
      projects: [p, ...state.projects],
      audit: [
        {
          id: uid("aud"),
          tsISO: new Date().toISOString(),
          actor: "Robin (You)",
          action: "Created project",
          target: p.name,
        },
        ...state.audit,
      ],
    });

    router.push(`/project?projectId=${encodeURIComponent(p.id)}`);
  }

  function saveAsDefaults() {
    if (!project) return;
    setState({
      ...state,
      defaults: {
        ...state.defaults,
        defaultReportingRegime: project.reportingRegime,
        defaultProfile: project.profile,
        defaultCompliance: project.compliance,
      },
      audit: [
        {
          id: uid("aud"),
          tsISO: new Date().toISOString(),
          actor: "Robin (You)",
          action: "Saved project as defaults",
          target: project.name,
        },
        ...state.audit,
      ],
    });
    alert("Saved as defaults (local-only).");
  }

  function goToJobs() {
    if (!project) return;
    router.push(`/jobs?projectId=${encodeURIComponent(project.id)}`);
  }

  if (!project) {
    return (
      <div>
        <TopBar
          state={state}
          setState={setState}
          onCreateProject={createProject}
          titleRight="Project"
          onUiModeChange={setUiMode}
        />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6">
            No project found.
          </div>
        </main>
      </div>
    );
  }

  const isFullUi = uiMode === "FULL";
  const profile = project.profile;

  return (
    <div>
      <TopBar
        state={state}
        setState={setState}
        onCreateProject={createProject}
        titleRight="Project"
        onUiModeChange={setUiMode}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-zinc-600">Project</div>
              <div className="mt-1 truncate text-2xl font-semibold text-zinc-900">
                {project.name}
              </div>
              <div className="mt-2 max-w-2xl text-sm text-zinc-600">
                Configure the first settings here. Jobs and reports will be handled in the next steps.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/dashboard"
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Back to Dashboard
              </a>

              <button
                onClick={saveAsDefaults}
                className="rounded-2xl border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Save as Defaults
              </button>

              <a
                href={`/run?projectId=${encodeURIComponent(project.id)}`}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                  "bg-gradient-to-r from-emerald-700 to-green-800 hover:opacity-95"
                )}
              >
                Run (later)
              </a>
            </div>
          </div>
        </div>

        {/* A) Project Info */}
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
            <div className="text-sm font-semibold text-zinc-900">A) Project info</div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-600">Name</label>
              <input
                value={project.name}
                onChange={(e) => patchProject({ name: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-600">Description</label>
              <textarea
                value={project.description ?? ""}
                onChange={(e) => patchProject({ description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-600">Reporting regime</label>
              <select
                value={project.reportingRegime}
                onChange={(e) =>
                  patchProject({ reportingRegime: e.target.value as ReportingRegime })
                }
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              >
                <option value="CANADA">Canada</option>
                <option value="EU">EU</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-600">Tags (comma-separated)</label>
              <input
                value={project.tags.join(", ")}
                onChange={(e) => patchProject({ tags: parseTags(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* B) Optimization Profile */}
        <div className="mt-4 rounded-3xl border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                <div className="text-sm font-semibold text-zinc-900">B) Optimization profile</div>
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Project-level profile. UI Lite keeps editing minimal; UI Full exposes advanced parameters.
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 text-sm">
              <div className="text-xs text-zinc-500">UI mode</div>
              <div className="font-semibold text-zinc-900">{uiMode}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-600">Profile mode</label>
              <select
                value={profile.mode}
                onChange={(e) => {
                  const m = e.target.value as "LITE" | "FULL";
                  if (m === "LITE") setProjectProfile({ mode: "LITE", preset: "BALANCED" });
                  else
                    setProjectProfile({
                      mode: "FULL",
                      weights: { co2: 40, cost: 30, time: 30, power: 0 },
                    });
                }}
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              >
                <option value="LITE">Lite</option>
                <option value="FULL">Full</option>
              </select>
            </div>

            <div className="text-sm text-zinc-600">
              <div className="text-xs text-zinc-500">Purpose</div>
              <div className="mt-1">
                {profile.mode === "LITE"
                  ? "Preset-driven, quick configuration."
                  : "Weighted objectives (more control)."}
              </div>
            </div>
          </div>

          {/* Lite profile */}
          {profile.mode === "LITE" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-600">Preset</label>
                <select
                  value={profile.preset}
                  onChange={(e) =>
                    setProjectProfile({
                      mode: "LITE",
                      preset: e.target.value as LitePreset,
                    })
                  }
                  className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="GREENEST">Greenest</option>
                  <option value="CHEAPEST">Cheapest</option>
                  <option value="FASTEST">Fastest</option>
                  <option value="BALANCED">Balanced</option>
                </select>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-sm text-zinc-700">
                <div className="text-xs font-semibold text-emerald-900">Guidance</div>
                <div className="mt-1">
                  Lite is intended for fast setup. Advanced constraints and fine-tuning are optional.
                </div>
              </div>
            </div>
          )}

          {/* Full profile */}
          {profile.mode === "FULL" && (
            <div className="mt-4">
              {!isFullUi ? (
                <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 text-sm text-zinc-700">
                  Advanced weight editing is hidden in UI Lite.
                  <div className="mt-2 text-xs text-zinc-500">
                    Switch UI mode (top-left) to <b>Full</b> to edit weights.
                  </div>
                  <div className="mt-3 grid gap-2 text-xs">
                    <div>
                      Current weights: CO₂ {profile.weights.co2}, Cost {profile.weights.cost},
                      Time {profile.weights.time}, Power {profile.weights.power}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["co2", "cost", "time", "power"] as const).map((k) => {
                    const v = profile.weights[k];
                    return (
                      <div
                        key={k}
                        className="rounded-2xl border border-emerald-200 bg-white/80 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-zinc-600">{k.toUpperCase()} weight</label>
                          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                            {v}
                          </div>
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={v}
                          onChange={(e) =>
                            setProjectProfile({
                              ...profile,
                              weights: { ...profile.weights, [k]: Number(e.target.value) },
                            })
                          }
                          className="range-emerald mt-3"
                          style={{ background: sliderBg(v) }}
                        />

                        <div className="mt-2 text-xs text-zinc-500">0–100 (relative importance)</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* C) Compliance */}
        <div className="mt-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-600" />
            <div className="text-sm font-semibold text-zinc-900">C) Compliance policy</div>
          </div>

          <div className="mt-1 text-sm text-zinc-600">
            Region policy and high-level constraints. UI Lite hides non-essential toggles.
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-600">Policy type</label>
              <select
                value={project.compliance.type}
                onChange={(e) => updateCompliance({ type: e.target.value as any })}
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              >
                <option value="WHITELIST">Whitelist</option>
                <option value="BLACKLIST">Blacklist</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-600">
                Regions / Countries (comma-separated; supports EU shortcut)
              </label>
              <input
                value={project.compliance.regions.join(", ")}
                onChange={(e) => updateCompliance({ regions: parseTags(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            {isFullUi && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-emerald-700"
                    checked={project.compliance.allowJobOverride}
                    onChange={(e) => updateCompliance({ allowJobOverride: e.target.checked })}
                  />
                  Allow job override
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-emerald-700"
                    checked={project.compliance.enforceDataResidency}
                    onChange={(e) => updateCompliance({ enforceDataResidency: e.target.checked })}
                  />
                  Enforce data residency
                </label>

                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    className="accent-emerald-700"
                    checked={project.compliance.noCrossBorderTransfer}
                    onChange={(e) => updateCompliance({ noCrossBorderTransfer: e.target.checked })}
                  />
                  No cross-border transfer
                </label>
              </>
            )}
          </div>
        </div>

        {/* Next steps (fixed redirection, no alerts) */}
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Next steps</div>
              <div className="mt-1 text-sm text-zinc-600">
                Jobs and reports are available in the Jobs page for this project.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goToJobs}
                className="rounded-2xl border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Configure Jobs
              </button>

              <button
                type="button"
                onClick={goToJobs}
                className="rounded-2xl bg-gradient-to-r from-emerald-700 to-green-800 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Reports & Receipts
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
