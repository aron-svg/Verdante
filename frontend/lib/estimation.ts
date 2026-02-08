import { CompliancePolicy, Estimates, Job, OptimizationProfile, Project } from "./types";

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const REGION_GRID_G_PER_KWH: Record<string, number> = {
  // Mock intensities for demo. Not a real dataset.
  CA: 140,
  EU: 260,
  FR: 90,
  DE: 420,
  NL: 380,
  IE: 300,
  UK: 230,
  US: 400,
};

const PROVIDER_COST_MULT: Record<string, number> = {
  AWS: 1.25,
  GCP: 1.18,
  Azure: 1.22,
  OVHcloud: 1.0,
};

const GPU_RATE_USD_PER_H: Record<string, number> = {
  NONE: 0.0,
  T4: 0.85,
  L4: 1.2,
  A10: 1.45,
  A100: 3.2,
  H100: 4.5,
};

const BASE_CPU_USD_PER_H = 0.18;

function effectiveProfile(job: Job, project: Project, profileFromDefaults: OptimizationProfile): OptimizationProfile {
  if (!job.inheritProjectSettings && job.overrideProfile) return job.overrideProfile;
  return project.profile ?? profileFromDefaults;
}

function effectiveCompliance(job: Job, project: Project, defaultsPolicy: CompliancePolicy): CompliancePolicy {
  if (!job.inheritCompliance && job.overrideCompliance) return job.overrideCompliance;
  return project.compliance ?? defaultsPolicy;
}

function normalizeWeights(p: { co2: number; cost: number; time: number; power: number }) {
  const s = p.co2 + p.cost + p.time + p.power;
  if (s <= 0) return { co2: 0.25, cost: 0.25, time: 0.25, power: 0.25 };
  return { co2: p.co2 / s, cost: p.cost / s, time: p.time / s, power: p.power / s };
}

function pickWorstGridIntensity(policy: CompliancePolicy): number {
  const regions = policy.regions.length ? policy.regions : ["EU", "CA"];
  const values = regions.map((r) => REGION_GRID_G_PER_KWH[r] ?? 350);
  return Math.max(...values, 350);
}

function worstProvider(allowed: string[] | undefined): { provider: string; mult: number } {
  const list = (allowed && allowed.length ? allowed : ["AWS", "GCP", "Azure", "OVHcloud"]);
  // worst-case cost = highest multiplier
  let best = { provider: list[0], mult: PROVIDER_COST_MULT[list[0]] ?? 1.2 };
  for (const p of list) {
    const m = PROVIDER_COST_MULT[p] ?? 1.2;
    if (m > best.mult) best = { provider: p, mult: m };
  }
  return best;
}

function powerKwForJob(job: Job): number {
  if (!job.compute.gpuRequired) return 0.8; // conservative CPU job
  switch (job.compute.gpuClass) {
    case "T4": return 1.8;
    case "L4": return 2.6;
    case "A10": return 3.0;
    case "A100": return 5.0;
    case "H100": return 5.5;
    default: return 2.5;
  }
}

export function estimateJob(job: Job, project: Project, defaultsProfile: OptimizationProfile, defaultsPolicy: CompliancePolicy): Estimates {
  const profile = effectiveProfile(job, project, defaultsProfile);
  const compliance = effectiveCompliance(job, project, defaultsPolicy);

  const baseRuntime = clamp(job.compute.expectedRuntimeHours || 1, 0.1, 240);
  const slowestBuffer = 1.45; // majorant: conservative time buffer
  const maxTimeHours = +(baseRuntime * slowestBuffer).toFixed(2);

  const maxPowerKw = +powerKwForJob(job).toFixed(2);

  const worstGrid = pickWorstGridIntensity(compliance); // g/kWh
  const energyKwh = maxPowerKw * maxTimeHours;
  const co2Buffer = 1.25;
  const maxCO2Kg = +((energyKwh * worstGrid) / 1000 * co2Buffer).toFixed(2);

  // cost majorant: worst provider multiplier + safety buffer
  let cost = maxTimeHours * BASE_CPU_USD_PER_H;
  if (job.compute.gpuRequired) cost += maxTimeHours * (GPU_RATE_USD_PER_H[job.compute.gpuClass] ?? 1.4);

  let allowedProviders: string[] | undefined = undefined;
  if (profile.mode === "FULL") allowedProviders = profile.provider?.allowedProviders;

  const wp = worstProvider(allowedProviders);
  const costBuffer = 1.18;
  const maxCostUsd = +(cost * wp.mult * costBuffer).toFixed(2);

  // confidence heuristic
  const confidence: Estimates["confidence"] =
    job.compute.expectedRuntimeHours > 0 && (job.compute.gpuRequired ? job.compute.gpuClass !== "NONE" : true)
      ? "HIGH"
      : "MED";

  // assumptions
  const assumptions: string[] = [
    "Worst-case (majorant) estimate with fixed safety buffers.",
    "Mock grid-intensity and price factors for demo; not a certified accounting dataset.",
    `Grid intensity worst-case within allowed regions: ~${worstGrid} gCO₂e/kWh (mock).`,
    `Cost worst-case provider multiplier selected: ${wp.provider}.`,
  ];

  // influence of objectives (only for explanation; max remains conservative)
  if (profile.mode === "LITE") assumptions.push(`Lite preset: ${profile.preset}.`);
  else {
    const w = normalizeWeights(profile.weights);
    assumptions.push(`Objective weights (normalized): CO₂ ${w.co2.toFixed(2)}, Cost ${w.cost.toFixed(2)}, Time ${w.time.toFixed(2)}, Power ${w.power.toFixed(2)}.`);
  }

  return { maxCostUsd, maxCO2Kg, maxPowerKw, maxTimeHours, confidence, assumptions };
}

export function estimateProject(project: Project, defaultsProfile: OptimizationProfile, defaultsPolicy: CompliancePolicy): { perJob: Record<string, Estimates>; totals: Estimates } {
  const perJob: Record<string, Estimates> = {};
  let sumCost = 0, sumCO2 = 0, sumTime = 0;
  let peakPower = 0;

  for (const job of project.jobs) {
    const e = estimateJob(job, project, defaultsProfile, defaultsPolicy);
    perJob[job.id] = e;
    sumCost += e.maxCostUsd;
    sumCO2 += e.maxCO2Kg;
    sumTime += e.maxTimeHours;
    peakPower = Math.max(peakPower, e.maxPowerKw);
  }

  const totals: Estimates = {
    maxCostUsd: +sumCost.toFixed(2),
    maxCO2Kg: +sumCO2.toFixed(2),
    maxPowerKw: +peakPower.toFixed(2),       // peak across jobs (conservative)
    maxTimeHours: +sumTime.toFixed(2),       // sum of maxima for MVP
    confidence: "MED",
    assumptions: ["Project totals are conservative: sum of per-job maxima (and peak power)."],
  };

  return { perJob, totals };
}
