import { CompliancePolicy, Job, OptimizationProfile, Project } from "./types";

const REGION_POOL: Array<{ code: string; label: string; mockGrid: number; mockCost: number }> = [
  { code: "CA", label: "Canada", mockGrid: 140, mockCost: 1.0 },
  { code: "EU", label: "EU (generic)", mockGrid: 260, mockCost: 1.1 },
  { code: "FR", label: "France", mockGrid: 90, mockCost: 1.12 },
  { code: "DE", label: "Germany", mockGrid: 420, mockCost: 1.05 },
];

const PROVIDERS = ["AWS", "GCP", "Azure", "OVHcloud"] as const;

function allowedRegion(policy: CompliancePolicy, code: string): boolean {
  const list = policy.regions.length ? policy.regions : ["EU", "CA"];
  if (policy.type === "WHITELIST") return list.includes(code) || (code !== "EU" && list.includes("EU"));
  // blacklist
  return !(list.includes(code) || (code !== "EU" && list.includes("EU")));
}

function profileFor(job: Job, project: Project, defaultsProfile: OptimizationProfile): OptimizationProfile {
  if (!job.inheritProjectSettings && job.overrideProfile) return job.overrideProfile;
  return project.profile ?? defaultsProfile;
}

function weightVector(profile: OptimizationProfile) {
  if (profile.mode === "LITE") {
    switch (profile.preset) {
      case "GREENEST": return { co2: 1, cost: 0, time: 0, power: 0 };
      case "CHEAPEST": return { co2: 0, cost: 1, time: 0, power: 0 };
      case "FASTEST": return { co2: 0, cost: 0, time: 1, power: 0 };
      default: return { co2: 0.5, cost: 0.3, time: 0.2, power: 0 };
    }
  }
  const w = profile.weights;
  const s = w.co2 + w.cost + w.time + w.power;
  return s > 0 ? { co2: w.co2 / s, cost: w.cost / s, time: w.time / s, power: w.power / s } : { co2: 0.25, cost: 0.25, time: 0.25, power: 0.25 };
}

export function buildExecutionPlan(
  project: Project,
  defaultsProfile: OptimizationProfile,
  defaultsCompliance: CompliancePolicy,
  compareMode: "GREENEST" | "CHEAPEST" | "FASTEST" | "AUTO",
) {
  const items = project.jobs.map((job) => {
    const compliance = job.inheritCompliance ? project.compliance ?? defaultsCompliance : (job.overrideCompliance ?? project.compliance ?? defaultsCompliance);
    const profile = profileFor(job, project, defaultsProfile);

    const w = compareMode === "AUTO"
      ? weightVector(profile)
      : compareMode === "GREENEST"
        ? { co2: 1, cost: 0, time: 0, power: 0 }
        : compareMode === "CHEAPEST"
          ? { co2: 0, cost: 1, time: 0, power: 0 }
          : { co2: 0, cost: 0, time: 1, power: 0 };

    const candidates = REGION_POOL.filter((r) => allowedRegion(compliance, r.code));
    const picked = (candidates.length ? candidates : REGION_POOL).slice().sort((a, b) => {
      const scoreA = a.mockGrid * w.co2 + a.mockCost * 100 * w.cost;
      const scoreB = b.mockGrid * w.co2 + b.mockCost * 100 * w.cost;
      return scoreA - scoreB;
    })[0];

    const provider = PROVIDERS[Math.floor((job.id.length * 17 + job.name.length * 7) % PROVIDERS.length)];

    const timeWindowLabel = job.batchableShiftable ? "Shifted window (off-peak / lower-carbon)" : "Immediate window (deadline/priority)";

    const tags: string[] = [];
    if (w.co2 >= w.cost && w.co2 >= w.time) tags.push("Lower CO₂");
    if (compliance.enforceDataResidency) tags.push("Meets data residency");
    if (compliance.noCrossBorderTransfer) tags.push("No cross-border transfer");
    if (job.deadlineISO) tags.push("Meets deadline");

    return { jobId: job.id, jobName: job.name, region: picked.code, provider, timeWindowLabel, rationaleTags: tags };
  });

  return items;
}
