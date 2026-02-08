"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import type { AppState, Project } from "@/lib/types";
import { loadState, saveState, uid } from "@/lib/storage";
import { makeSeedState } from "@/lib/seed";
import { loadUiMode, type UIMode } from "@/lib/uiMode";

function cls(...x: Array<string | false | null | undefined>) {
  return x.filter(Boolean).join(" ");
}

export default function DashboardPage() {
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

  const projects = state.projects;

  const stats = useMemo(() => {
    const jobCount = projects.reduce((acc, p) => acc + p.jobs.length, 0);
    return { projectCount: projects.length, jobCount };
  }, [projects]);

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
  }

  function deleteProject(projectId: string) {
    const p = state.projects.find((x) => x.id === projectId);
    if (!p) return;

    const ok = window.confirm(`Delete project "${p.name}"?\nThis cannot be undone.`);
    if (!ok) return;

    const remaining = state.projects.filter((x) => x.id !== projectId);

    setState({
      ...state,
      projects: remaining,
      audit: [
        {
          id: uid("aud"),
          tsISO: new Date().toISOString(),
          actor: "Robin (You)",
          action: "Deleted project",
          target: p.name,
        },
        ...state.audit,
      ],
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50">
      <TopBar
        state={state}
        setState={setState}
        onCreateProject={createProject}
        titleRight="Dashboard"
        onUiModeChange={setUiMode}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Hero / Overview */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 via-white to-sky-100 p-6 shadow-sm">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-sky-200/40 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-zinc-700">Workspace</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{state.workspace.name}</div>
              <div className="mt-2 max-w-xl text-sm text-zinc-700">
                Tableau de bord minimal. Les détails (jobs, conformité, paramètres avancés, rapports) sont dans la page projet.
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-900">
                  {stats.projectCount} project(s)
                </span>
                <span className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-900">
                  {stats.jobCount} job(s)
                </span>
                <span className="rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-semibold text-sky-900">
                  UI: {uiMode}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
              <div className="text-xs text-zinc-500">Quick actions</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={createProject}
                  className={cls(
                    "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                    "bg-gradient-to-r from-emerald-700 to-green-800 hover:opacity-95"
                  )}
                >
                  Create Project
                </button>
                <a
                  href="/jobs"
                  className={cls(
                    "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm",
                    "border border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50"
                  )}
                  title="Open jobs page (you can also run from a specific project card)"
                >
                  Jobs
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-lg font-semibold text-zinc-900">Projects</div>
              <div className="text-sm text-zinc-700">
                {uiMode === "LITE"
                  ? "Vue Lite: liste minimaliste."
                  : "Vue Full: un peu plus de contexte (sans surcharger)."}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-semibold text-emerald-900">
              Tip: Run opens Jobs (demo run + PDF report)
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className={cls(
                  "rounded-3xl border border-emerald-200 p-5 shadow-sm",
                  "bg-gradient-to-br from-white via-emerald-50 to-sky-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-zinc-900">{p.name}</div>
                    {uiMode === "FULL" && (
                      <div className="mt-1 text-sm text-zinc-700">
                        {p.description?.trim() ? p.description : "No description"}
                      </div>
                    )}
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                    {p.reportingRegime}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-emerald-900">
                    {p.jobs.length} job(s)
                  </span>

                  {uiMode === "FULL" && (
                    <>
                      <span className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-emerald-900">
                        Compliance: {p.compliance.type}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-emerald-900">
                        Regions: {p.compliance.regions.join(", ")}
                      </span>
                    </>
                  )}
                </div>

                {uiMode === "FULL" && p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {p.tags.slice(0, 6).map((t) => (
                      <span key={t} className="rounded-full bg-emerald-100/60 px-3 py-1 text-emerald-900">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <a
                    href={`/project?projectId=${encodeURIComponent(p.id)}`}
                    className={cls(
                      "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                      "bg-gradient-to-r from-emerald-700 to-green-800 hover:opacity-95"
                    )}
                  >
                    Open
                  </a>

                  {/* IMPORTANT: Run must open Jobs page */}
                  <a
                    href={`/jobs?projectId=${encodeURIComponent(p.id)}`}
                    className={cls(
                      "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm",
                      "border border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50"
                    )}
                  >
                    Run
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteProject(p.id)}
                    className={cls(
                      "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm",
                      "border border-red-200 bg-gradient-to-r from-red-50 to-white text-red-700 hover:from-red-100"
                    )}
                    title="Delete project (local only)"
                  >
                    Delete
                  </button>

                  {uiMode === "FULL" && <div className="ml-auto text-[11px] text-zinc-500">ID: {p.id}</div>}
                </div>

                {uiMode === "FULL" && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/60 p-3 text-xs text-zinc-700">
                    <div className="font-semibold text-emerald-900">Summary</div>
                    <div className="mt-1">
                      Profile: {p.profile.mode === "LITE" ? `Lite (${p.profile.preset})` : "Full (weighted)"} · Regime:{" "}
                      {p.reportingRegime}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {projects.length === 0 && (
              <div className="rounded-3xl border border-dashed border-emerald-300 bg-white/70 p-8 text-center text-sm text-zinc-700 sm:col-span-2">
                No projects yet. Use “Create Project”.
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        {uiMode === "FULL" && (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-white/70 p-5">
            <div className="text-sm font-semibold text-zinc-900">Recent activity</div>
            <div className="mt-2 max-h-48 overflow-auto rounded-2xl border border-emerald-200 bg-white/60 p-3 text-xs">
              {state.audit.slice(0, 10).map((a) => (
                <div key={a.id} className="border-b border-emerald-100 py-2 last:border-b-0">
                  <div className="text-zinc-600">{a.tsISO}</div>
                  <div className="font-medium text-zinc-900">
                    {a.actor}: {a.action}
                  </div>
                  <div className="text-zinc-600">{a.target}</div>
                </div>
              ))}
              {state.audit.length === 0 && <div className="text-zinc-600">No audit entries yet.</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
