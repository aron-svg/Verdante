// FILE: app/jobs/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import type { AppState, Project, ReportingRegime, RunResult } from "@/lib/types";
import { loadState, saveState, uid, downloadJson } from "@/lib/storage";
import { estimateProject } from "@/lib/estimation";
import { buildExecutionPlan } from "@/lib/plan";
import { loadUiMode, type UIMode } from "@/lib/uiMode";

type PrintMode = "NONE" | "REPORT" | "RECEIPT";

function cls(...x: Array<string | false | null | undefined>) {
  return x.filter(Boolean).join(" ");
}

function Money(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function Num(v: number, unit: string, digits = 1) {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: digits })} ${unit}`;
}

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function JobsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [state, setState] = useState<AppState | null>(null);
  const [uiMode, setUiMode] = useState<UIMode>("LITE");

  const [regime, setRegime] = useState<ReportingRegime>("BOTH");
  const [compareMode, setCompareMode] = useState<"AUTO" | "GREENEST" | "CHEAPEST" | "FASTEST">("AUTO");

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);

  const [printMode, setPrintMode] = useState<PrintMode>("NONE");
  const [scopeJobId, setScopeJobId] = useState<string | "ALL">("ALL");

  const timerRef = useRef<number | null>(null);

  // Load persisted state safely (avoid hydration mismatches)
  useEffect(() => {
    const s = loadState();
    setState(s);
    setUiMode(loadUiMode());
  }, []);

  useEffect(() => {
    if (!state) return;
    saveState(state);
  }, [state]);

  useEffect(() => {
    const after = () => setPrintMode("NONE");
    window.addEventListener("afterprint", after);
    return () => window.removeEventListener("afterprint", after);
  }, []);

  const projectIdFromUrl = sp.get("projectId") ?? "";
  const selectedProjectId = useMemo(() => {
    if (!state) return "";
    if (projectIdFromUrl && state.projects.some((p) => p.id === projectIdFromUrl)) return projectIdFromUrl;
    return state.projects[0]?.id ?? "";
  }, [state, projectIdFromUrl]);

  const project: Project | null = useMemo(() => {
    if (!state) return null;
    return state.projects.find((p) => p.id === selectedProjectId) ?? null;
  }, [state, selectedProjectId]);

  useEffect(() => {
    if (project) {
      setRegime(project.reportingRegime);
      setScopeJobId("ALL");
      setResult(null);
      setLogs([]);
      setProgress(0);
      setRunning(false);
    }
  }, [project?.id]);

  const estimates = useMemo(() => {
    if (!state || !project) return null;
    return estimateProject(project, state.defaults.defaultProfile, state.defaults.defaultCompliance);
  }, [state, project]);

  const plan = useMemo(() => {
    if (!state || !project) return [];
    const jobs = scopeJobId === "ALL" ? project.jobs : project.jobs.filter((j) => j.id === scopeJobId);
    const scoped: Project = { ...project, jobs };
    return buildExecutionPlan(scoped, state.defaults.defaultProfile, state.defaults.defaultCompliance, compareMode);
  }, [state, project, scopeJobId, compareMode]);

  const reportLabel =
    regime === "CANADA"
      ? "Canada — aligned GHG reporting format"
      : regime === "EU"
        ? "EU — aligned CSRD/ESRS format"
        : "Canada + EU — aligned formats";

  function setProjectInUrl(id: string) {
    router.push(`/jobs?projectId=${encodeURIComponent(id)}`);
  }

  function startRun() {
    if (!state || !project || !estimates) return;
    if (running) return;

    const jobsInScope = scopeJobId === "ALL" ? project.jobs : project.jobs.filter((j) => j.id === scopeJobId);
    if (jobsInScope.length === 0) return;

    setRunning(true);
    setProgress(0);
    setLogs([]);
    setResult(null);

    const seed = hash32(project.id + (scopeJobId === "ALL" ? "ALL" : scopeJobId) + compareMode + regime);
    const rnd = mulberry32(seed);

    const baseLogs = [
      "Initializing job runner (demo)...",
      "Validating compliance constraints (whitelist/blacklist)...",
      "Computing worst-case guardrails (majorant buffers)...",
      "Selecting eligible regions/providers (mock planner)...",
      "Generating aligned report sections...",
      "Finalizing receipt & integrity hash...",
    ];

    const durationMs = 9000;
    const tickMs = 350;
    const steps = Math.ceil(durationMs / tickMs);
    let i = 0;

    timerRef.current = window.setInterval(() => {
      i += 1;
      setProgress(Math.min(100, Math.round((i / steps) * 100)));

      const ts = new Date().toISOString();
      if (i % 2 === 0) {
        const msg = baseLogs[Math.min(baseLogs.length - 1, Math.floor(i / 2) - 1)] ?? "Running...";
        setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
      } else {
        setLogs((prev) => [...prev, `[${ts}] Job status tick: Queued → Running → Done (simulated).`]);
      }

      if (i >= steps) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;

        const jobsActuals = jobsInScope.map((j) => {
          const e = estimates.perJob[j.id];
          const frac = 0.58 + rnd() * 0.28; // 0.58..0.86
          const pl = plan.find((x) => x.jobId === j.id);

          return {
            jobId: j.id,
            actualCostUsd: +(e.maxCostUsd * frac).toFixed(2),
            actualCO2Kg: +(e.maxCO2Kg * frac).toFixed(2),
            actualPowerKw: +(e.maxPowerKw * (0.85 + rnd() * 0.2)).toFixed(2),
            actualTimeHours: +(e.maxTimeHours * (0.72 + rnd() * 0.22)).toFixed(2),
            region: pl?.region ?? "EU",
            provider: pl?.provider ?? "OVHcloud",
            timeWindowLabel: pl?.timeWindowLabel ?? "Immediate window",
            rationaleTags: pl?.rationaleTags ?? [],
          };
        });

        const rr: RunResult = {
          id: uid("run"),
          projectId: project.id,
          tsISO: new Date().toISOString(),
          regime,
          jobs: jobsActuals,
          logs: [
            ...baseLogs.map((x) => `[${new Date().toISOString()}] ${x}`),
            `[${new Date().toISOString()}] Completed.`,
          ],
        };

        setResult(rr);

        setState({
          ...state,
          audit: [
            {
              id: uid("aud"),
              tsISO: new Date().toISOString(),
              actor: "Robin (You)",
              action: "Ran jobs (demo)",
              target: `${project.name} • scope=${scopeJobId === "ALL" ? "ALL" : scopeJobId} • regime=${regime}`,
            },
            ...state.audit,
          ],
        });

        setRunning(false);
      }
    }, tickMs);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const totalsActual = useMemo(() => {
    if (!result) return null;
    return result.jobs.reduce(
      (acc, j) => {
        acc.cost += j.actualCostUsd;
        acc.co2 += j.actualCO2Kg;
        acc.time += j.actualTimeHours;
        acc.peakPower = Math.max(acc.peakPower, j.actualPowerKw);
        return acc;
      },
      { cost: 0, co2: 0, time: 0, peakPower: 0 }
    );
  }, [result]);

  const receipt = useMemo(() => {
    if (!project || !result || !totalsActual || !estimates) return null;

    const max = estimates.totals;
    const payload = {
      type: "VerdanteDemoReceipt",
      version: 1,
      receiptId: `rcpt_${hash32(result.id + project.id).toString(16)}`,
      issuedAtISO: result.tsISO,
      project: { id: project.id, name: project.name },
      regime: result.regime,
      scope: scopeJobId,
      maxTotals: max,
      actualTotals: {
        costUsd: +totalsActual.cost.toFixed(2),
        co2Kg: +totalsActual.co2.toFixed(2),
        peakPowerKw: +totalsActual.peakPower.toFixed(2),
        timeHours: +totalsActual.time.toFixed(2),
      },
      lineItems: result.jobs.map((j) => {
        const jobName = project.jobs.find((x) => x.id === j.jobId)?.name ?? j.jobId;
        return {
          jobId: j.jobId,
          jobName,
          provider: j.provider,
          region: j.region,
          window: j.timeWindowLabel,
          costUsd: j.actualCostUsd,
          co2Kg: j.actualCO2Kg,
          timeHours: j.actualTimeHours,
          peakPowerKw: j.actualPowerKw,
        };
      }),
    };

    const integrity = hash32(JSON.stringify(payload)).toString(16).padStart(8, "0");
    return { ...payload, integrityHash32: integrity };
  }, [project, result, totalsActual, estimates, scopeJobId]);

  function exportReportPdf() {
    setPrintMode("REPORT");
    window.setTimeout(() => window.print(), 30);
  }

  function exportReceiptPdf() {
    setPrintMode("RECEIPT");
    window.setTimeout(() => window.print(), 30);
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-zinc-900">Loading…</div>
            <div className="mt-2 text-sm text-zinc-600">Initializing local state.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <TopBar state={state} setState={setState} onCreateProject={() => {}} titleRight="Jobs + Reports" onUiModeChange={setUiMode} />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-zinc-900">No project found</div>
            <div className="mt-2 text-sm text-zinc-600">Create a project from the dashboard first.</div>
            <a
              href="/"
              className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-emerald-700 to-green-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Go to Dashboard
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        state={state}
        setState={setState}
        onCreateProject={() => {
          // Keep create flow centralized on dashboard/project page
          router.push("/");
        }}
        titleRight="Jobs + Reports"
        onUiModeChange={setUiMode}
      />

      <main className={cls("mx-auto max-w-6xl px-4 py-6", printMode !== "NONE" && "print-root")}>
        {/* SCREEN UI */}
        <div className={cls("screen-only", printMode !== "NONE" && "hidden")}>
          <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-zinc-600">Project</div>
                <div className="mt-1 truncate text-2xl font-semibold text-zinc-900">{project.name}</div>
                <div className="mt-2 text-sm text-zinc-600">
                  Jobs runner (demo) + aligned report output + receipt. Not a legal certification.
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm">
                <div className="text-xs text-zinc-500">Options</div>

                <div className="mt-2 grid gap-2">
                  <label className="text-xs text-zinc-600">Project selection</label>
                  <select
                    value={project.id}
                    onChange={(e) => setProjectInUrl(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <label className="mt-2 text-xs text-zinc-600">Report regime</label>
                  <select
                    value={regime}
                    onChange={(e) => setRegime(e.target.value as ReportingRegime)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                    title="Aligned format selection (not legal certification)"
                  >
                    <option value="CANADA">Canada</option>
                    <option value="EU">EU</option>
                    <option value="BOTH">Both</option>
                  </select>

                  <div className="mt-2 text-xs text-zinc-500">
                    UI mode: <span className="font-medium">{uiMode}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* JOBS */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-zinc-900">Jobs</div>
                  <div className="text-sm text-zinc-600">
                    {uiMode === "LITE"
                      ? "Lite view: essentials + run."
                      : "Full view: includes planner tags and more context."}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/project?projectId=${encodeURIComponent(project.id)}`}
                    className="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Back to Project
                  </a>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-zinc-600">Scope</label>
                    <select
                      value={scopeJobId}
                      onChange={(e) => setScopeJobId((e.target.value as any) ?? "ALL")}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="ALL">All jobs</option>
                      {project.jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-600">Planner mode (demo)</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(["AUTO", "GREENEST", "CHEAPEST", "FASTEST"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setCompareMode(m)}
                          className={cls(
                            "rounded-2xl px-3 py-2 text-sm font-semibold border",
                            compareMode === m
                              ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                          )}
                        >
                          {m === "AUTO" ? "Auto" : m[0] + m.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-emerald-50 p-5">
                  <div className="text-sm font-semibold text-zinc-900">Execution plan (preview)</div>
                  <div className="mt-2 grid gap-2">
                    {plan.length === 0 && <div className="text-sm text-zinc-600">No jobs in scope.</div>}
                    {plan.map((it) => (
                      <div key={it.jobId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-zinc-900">{it.jobName}</div>
                            <div className="mt-1 text-sm text-zinc-600">
                              Region <span className="font-medium">{it.region}</span> • Provider{" "}
                              <span className="font-medium">{it.provider}</span>
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">Window: {it.timeWindowLabel}</div>
                          </div>

                          {uiMode === "FULL" && (
                            <div className="flex flex-wrap gap-2">
                              {it.rationaleTags.map((t) => (
                                <span key={t} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 rounded-3xl border border-zinc-200 bg-white p-5">
                  <div className="text-sm font-semibold text-zinc-900">Worst-case guardrails (max)</div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Guardrail label="Max Cost" value={estimates ? Money(estimates.totals.maxCostUsd) : "—"} />
                    <Guardrail label="Max CO₂" value={estimates ? Num(estimates.totals.maxCO2Kg, "kgCO₂e", 1) : "—"} />
                    <Guardrail label="Max Peak Power" value={estimates ? Num(estimates.totals.maxPowerKw, "kW", 1) : "—"} />
                    <Guardrail label="Max Time" value={estimates ? Num(estimates.totals.maxTimeHours, "h", 1) : "—"} />
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">
                    These are conservative maxima (majorant) for demo purposes.
                  </div>
                </div>
              </div>
            </div>

            {/* RUN PANEL */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold text-zinc-900">Run (demo)</div>
              <div className="mt-1 text-sm text-zinc-600">{reportLabel}</div>

              <button
                onClick={startRun}
                disabled={running || !estimates || (scopeJobId !== "ALL" && !project.jobs.some((j) => j.id === scopeJobId))}
                className={cls(
                  "mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm",
                  "bg-gradient-to-r from-emerald-700 to-green-800 hover:opacity-95 disabled:opacity-60"
                )}
              >
                {running ? "Running…" : "Run now"}
              </button>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full bg-emerald-700" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3 text-xs">
                {logs.length === 0 ? (
                  <div className="text-zinc-500">Logs will appear here.</div>
                ) : (
                  <div className="max-h-52 overflow-auto">
                    {logs.slice(-120).map((l, idx) => (
                      <div key={idx} className="border-b border-zinc-100 py-1 last:border-b-0">
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                Export is print-to-PDF (report / receipt) + JSON files for local storage.
              </div>
            </div>
          </div>

          {/* REPORT + RECEIPT VIEW */}
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-zinc-900">Report + Receipt</div>
                <div className="text-sm text-zinc-600">Generated after a run (demo). Aligned formats; not legal certification.</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportReportPdf()}
                  disabled={!result}
                  className={cls(
                    "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                    "bg-gradient-to-r from-emerald-700 to-green-800 hover:opacity-95 disabled:opacity-60"
                  )}
                >
                  Export Report PDF
                </button>

                <button
                  onClick={() => exportReceiptPdf()}
                  disabled={!receipt}
                  className={cls(
                    "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm",
                    "border border-emerald-700 text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
                  )}
                >
                  Export Receipt PDF
                </button>

                <button
                  onClick={() => {
                    if (!result || !estimates) return;
                    downloadJson(`verdante-report-${project.id}-${result.id}.json`, { project, regime, compareMode, estimates, runResult: result });
                  }}
                  disabled={!result || !estimates}
                  className={cls(
                    "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm",
                    "border border-zinc-300 text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                  )}
                >
                  Export Report JSON
                </button>

                <button
                  onClick={() => {
                    if (!receipt) return;
                    downloadJson(`verdante-receipt-${receipt.receiptId}.json`, receipt);
                  }}
                  disabled={!receipt}
                  className={cls(
                    "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm",
                    "border border-zinc-300 text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                  )}
                >
                  Export Receipt JSON
                </button>
              </div>
            </div>

            {!result && (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
                Run the jobs to generate the report and receipt.
              </div>
            )}

            {result && estimates && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-emerald-50 p-5">
                  <div className="text-sm font-semibold text-zinc-900">Executive Summary</div>
                  <div className="mt-2 text-sm text-zinc-600">
                    Report: <span className="font-medium">{reportLabel}</span>
                    <br />
                    Scope: <span className="font-medium">{scopeJobId === "ALL" ? "All jobs" : "Single job"}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <SummaryRow label="Cost" max={Money(estimates.totals.maxCostUsd)} act={totalsActual ? Money(totalsActual.cost) : "—"} />
                    <SummaryRow label="CO₂" max={Num(estimates.totals.maxCO2Kg, "kgCO₂e", 1)} act={totalsActual ? Num(totalsActual.co2, "kgCO₂e", 1) : "—"} />
                    <SummaryRow label="Peak Power" max={Num(estimates.totals.maxPowerKw, "kW", 1)} act={totalsActual ? Num(totalsActual.peakPower, "kW", 1) : "—"} />
                    <SummaryRow label="Time" max={Num(estimates.totals.maxTimeHours, "h", 1)} act={totalsActual ? Num(totalsActual.time, "h", 1) : "—"} />
                  </div>

                  <div className="mt-4 text-xs text-zinc-600">
                    Notes:
                    <ul className="mt-2 list-disc pl-5">
                      <li>Worst-case totals are conservative guardrails (majorant policy).</li>
                      <li>Actuals are simulated deterministically for the demo.</li>
                      <li>Aligned reporting labels; not a legal certification.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <div className="text-sm font-semibold text-zinc-900">Compliance + Method</div>

                  <div className="mt-2 text-sm text-zinc-600">
                    Policy: <span className="font-medium">{project.compliance.type}</span>
                    <br />
                    Regions: <span className="font-medium">{project.compliance.regions.join(", ")}</span>
                    <br />
                    Data residency: <span className="font-medium">{project.compliance.enforceDataResidency ? "On" : "Off"}</span> • No cross-border transfer:{" "}
                    <span className="font-medium">{project.compliance.noCrossBorderTransfer ? "On" : "Off"}</span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    Method (demo):
                    <ul className="mt-2 list-disc pl-5">
                      <li>Energy = Power (kW) × Runtime (h).</li>
                      <li>CO₂ = Energy (kWh) × Grid Intensity (g/kWh) ÷ 1000, plus buffer.</li>
                      <li>Costs use mocked hourly rates and worst-provider multipliers.</li>
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-5">
                  <div className="text-sm font-semibold text-zinc-900">Breakdown (Actuals)</div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead className="text-left text-zinc-600">
                        <tr className="border-b border-zinc-200">
                          <th className="py-2">Job</th>
                          <th className="py-2">Region</th>
                          <th className="py-2">Provider</th>
                          <th className="py-2">Window</th>
                          <th className="py-2">Cost</th>
                          <th className="py-2">CO₂</th>
                          <th className="py-2">Time</th>
                          <th className="py-2">Peak Power</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.jobs.map((j) => {
                          const jobName = project.jobs.find((x) => x.id === j.jobId)?.name ?? j.jobId;
                          return (
                            <tr key={j.jobId} className="border-b border-zinc-100">
                              <td className="py-3">
                                <div className="font-medium text-zinc-900">{jobName}</div>
                                {uiMode === "FULL" && j.rationaleTags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {j.rationaleTags.map((t) => (
                                      <span key={t} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3">{j.region}</td>
                              <td className="py-3">{j.provider}</td>
                              <td className="py-3">{j.timeWindowLabel}</td>
                              <td className="py-3">{Money(j.actualCostUsd)}</td>
                              <td className="py-3">{Num(j.actualCO2Kg, "kg", 1)}</td>
                              <td className="py-3">{Num(j.actualTimeHours, "h", 1)}</td>
                              <td className="py-3">{Num(j.actualPowerKw, "kW", 1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {receipt && (
                  <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-emerald-50 p-5">
                    <div className="text-sm font-semibold text-zinc-900">Receipt (local)</div>
                    <div className="mt-2 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-zinc-500">Receipt ID</div>
                        <div className="font-semibold">{receipt.receiptId}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Integrity Hash (32-bit)</div>
                        <div className="font-mono font-semibold">{receipt.integrityHash32}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Issued at</div>
                        <div className="font-semibold">{receipt.issuedAtISO}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Regime</div>
                        <div className="font-semibold">{receipt.regime}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-sm">
                      <div className="font-semibold text-zinc-900">Totals (Actual)</div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-4">
                        <MiniKpi label="Cost" value={Money(receipt.actualTotals.costUsd)} />
                        <MiniKpi label="CO₂" value={Num(receipt.actualTotals.co2Kg, "kgCO₂e", 1)} />
                        <MiniKpi label="Peak Power" value={Num(receipt.actualTotals.peakPowerKw, "kW", 1)} />
                        <MiniKpi label="Time" value={Num(receipt.actualTotals.timeHours, "h", 1)} />
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-zinc-600">
                      This receipt is generated locally for the demo (audit-style artifact).
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PRINT: REPORT */}
        {printMode === "REPORT" && result && estimates && (
          <div className="print-only">
            <PrintableHeader
              title="Verdante — Carbon-Aware Jobs Report"
              subtitle={`${reportLabel} • Project: ${project.name} • Run: ${result.id}`}
            />
            <section className="print-section">
              <h2>Executive Summary</h2>
              <p>
                Aligned reporting format (demo). This document is not a legal certification.
              </p>
              <ul>
                <li>Issued at: {result.tsISO}</li>
                <li>Scope: {scopeJobId === "ALL" ? "All jobs" : "Single job"}</li>
                <li>Planner mode: {compareMode}</li>
              </ul>

              <h3>Totals — Max vs Actual</h3>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Max (worst-case)</th>
                    <th>Actual (simulated)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cost</td>
                    <td>{Money(estimates.totals.maxCostUsd)}</td>
                    <td>{totalsActual ? Money(totalsActual.cost) : "—"}</td>
                  </tr>
                  <tr>
                    <td>CO₂</td>
                    <td>{Num(estimates.totals.maxCO2Kg, "kgCO₂e", 1)}</td>
                    <td>{totalsActual ? Num(totalsActual.co2, "kgCO₂e", 1) : "—"}</td>
                  </tr>
                  <tr>
                    <td>Peak Power</td>
                    <td>{Num(estimates.totals.maxPowerKw, "kW", 1)}</td>
                    <td>{totalsActual ? Num(totalsActual.peakPower, "kW", 1) : "—"}</td>
                  </tr>
                  <tr>
                    <td>Time</td>
                    <td>{Num(estimates.totals.maxTimeHours, "h", 1)}</td>
                    <td>{totalsActual ? Num(totalsActual.time, "h", 1) : "—"}</td>
                  </tr>
                </tbody>
              </table>

              <h3>Compliance Summary</h3>
              <ul>
                <li>Policy: {project.compliance.type}</li>
                <li>Regions: {project.compliance.regions.join(", ")}</li>
                <li>Data residency: {project.compliance.enforceDataResidency ? "On" : "Off"}</li>
                <li>No cross-border transfer: {project.compliance.noCrossBorderTransfer ? "On" : "Off"}</li>
              </ul>

              <h3>Breakdown</h3>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Region</th>
                    <th>Provider</th>
                    <th>Window</th>
                    <th>Cost</th>
                    <th>CO₂</th>
                    <th>Time</th>
                    <th>Peak Power</th>
                  </tr>
                </thead>
                <tbody>
                  {result.jobs.map((j) => {
                    const jobName = project.jobs.find((x) => x.id === j.jobId)?.name ?? j.jobId;
                    return (
                      <tr key={j.jobId}>
                        <td>{jobName}</td>
                        <td>{j.region}</td>
                        <td>{j.provider}</td>
                        <td>{j.timeWindowLabel}</td>
                        <td>{Money(j.actualCostUsd)}</td>
                        <td>{Num(j.actualCO2Kg, "kg", 1)}</td>
                        <td>{Num(j.actualTimeHours, "h", 1)}</td>
                        <td>{Num(j.actualPowerKw, "kW", 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <h3>Methodology (Demo)</h3>
              <ul>
                <li>Energy = power (kW) × runtime (h).</li>
                <li>CO₂ = energy (kWh) × grid intensity (g/kWh) ÷ 1000, plus buffer.</li>
                <li>Costs use mocked hourly rates and worst-provider multipliers.</li>
              </ul>
            </section>
          </div>
        )}

        {/* PRINT: RECEIPT */}
        {printMode === "RECEIPT" && receipt && (
          <div className="print-only">
            <PrintableHeader
              title="Verdante — Demo Receipt"
              subtitle={`Receipt: ${receipt.receiptId} • Project: ${receipt.project.name}`}
            />
            <section className="print-section">
              <h2>Receipt Metadata</h2>
              <table className="print-table">
                <tbody>
                  <tr><td>Receipt ID</td><td>{receipt.receiptId}</td></tr>
                  <tr><td>Issued At</td><td>{receipt.issuedAtISO}</td></tr>
                  <tr><td>Regime</td><td>{receipt.regime}</td></tr>
                  <tr><td>Scope</td><td>{String(receipt.scope)}</td></tr>
                  <tr><td>Integrity Hash (32-bit)</td><td style={{ fontFamily: "monospace" }}>{receipt.integrityHash32}</td></tr>
                </tbody>
              </table>

              <h2>Totals (Actual)</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Cost</th>
                    <th>CO₂</th>
                    <th>Peak Power</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{Money(receipt.actualTotals.costUsd)}</td>
                    <td>{Num(receipt.actualTotals.co2Kg, "kgCO₂e", 1)}</td>
                    <td>{Num(receipt.actualTotals.peakPowerKw, "kW", 1)}</td>
                    <td>{Num(receipt.actualTotals.timeHours, "h", 1)}</td>
                  </tr>
                </tbody>
              </table>

              <h2>Line Items</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Provider</th>
                    <th>Region</th>
                    <th>Window</th>
                    <th>Cost</th>
                    <th>CO₂</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.lineItems.map((li) => (
                    <tr key={li.jobId}>
                      <td>{li.jobName}</td>
                      <td>{li.provider}</td>
                      <td>{li.region}</td>
                      <td>{li.window}</td>
                      <td>{Money(li.costUsd)}</td>
                      <td>{Num(li.co2Kg, "kg", 1)}</td>
                      <td>{Num(li.timeHours, "h", 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p style={{ marginTop: 12 }}>
                This receipt is generated locally for the demo (audit-style artifact). Not a legal certification.
              </p>
            </section>
          </div>
        )}

        <style jsx global>{`
          .print-only {
            display: none;
          }
          @media print {
            .screen-only {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            html,
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .print-section {
              padding: 16px 0;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 8px;
            }
            .print-table th,
            .print-table td {
              border: 1px solid #d1d5db;
              padding: 8px;
              vertical-align: top;
            }
            .print-table th {
              background: #f3f4f6;
              text-align: left;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

function Guardrail(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2">
      <div className="text-zinc-600">{props.label}</div>
      <div className="font-semibold text-zinc-900">{props.value}</div>
    </div>
  );
}

function SummaryRow(props: { label: string; max: string; act: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
      <div className="text-zinc-700">{props.label}</div>
      <div className="text-right">
        <div className="text-[11px] text-zinc-500">Max</div>
        <div className="font-semibold text-zinc-900">{props.max}</div>
      </div>
      <div className="text-right">
        <div className="text-[11px] text-zinc-500">Actual</div>
        <div className="font-semibold text-zinc-900">{props.act}</div>
      </div>
    </div>
  );
}

function MiniKpi(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="text-[11px] text-zinc-500">{props.label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{props.value}</div>
    </div>
  );
}

function PrintableHeader(props: { title: string; subtitle: string }) {
  return (
    <div style={{ padding: "8px 0 12px", borderBottom: "2px solid #111827" }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{props.title}</div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#374151" }}>{props.subtitle}</div>
    </div>
  );
}
