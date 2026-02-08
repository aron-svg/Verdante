import { AppState, Project } from "./types";

const SEED_NOW_ISO = "2026-02-07T12:00:00.000Z";
const SEED_DEADLINE_DATE = "2026-02-09";

const sampleProject: Project = {
  id: "proj_seed_001",
  name: "LLM Fine-Tuning — Customer Support Bot",
  description: "Carbon-aware orchestration mockup: worst-case estimates, compliance constraints, and audit-style reporting.",
  tags: ["LLM", "GPU", "Customer Support", "Compliance"],
  reportingRegime: "BOTH",
  profile: {
    mode: "FULL",
    weights: { co2: 50, cost: 30, time: 20, power: 0 },
    hard: { maxBudgetUsd: 2500 },
    scheduling: { batchableShiftable: true },
    provider: { allowedProviders: ["AWS", "GCP", "Azure", "OVHcloud"], allowedInstanceFamilies: ["General", "Compute", "GPU"] },
    dataHandling: { enforceDataResidency: true, noCrossBorderTransfer: true },
  },
  compliance: {
    type: "WHITELIST",
    regions: ["EU", "CA"],
    allowJobOverride: true,
    enforceDataResidency: true,
    noCrossBorderTransfer: true,
  },
  jobs: [
    {
      id: "job_001",
      name: "Data preprocessing",
      type: "BATCH",
      priority: "LOW",
      batchableShiftable: true,
      compute: { gpuRequired: false, gpuClass: "NONE", expectedRuntimeHours: 3.5 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
      notes: "Batchable; prefer low-carbon window.",
    },
    {
      id: "job_002",
      name: "Training run",
      type: "TRAINING",
      priority: "CRITICAL",
      deadlineISO: SEED_DEADLINE_DATE,
      batchableShiftable: false,
      compute: { gpuRequired: true, gpuClass: "A100", expectedRuntimeHours: 11.0 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
      notes: "GPU required; deadline constrained.",
    },
  ],
};

export function makeSeedState(): AppState {
  return {
    version: 1,
    workspace: {
      id: "ws_local_001",
      name: "Hackathon Workspace",
      membersMock: [
        { name: "Robin (You)", role: "Owner", presence: "editing" },
        { name: "Alex", role: "Editor", presence: "viewing" },
        { name: "Sam", role: "Viewer", presence: "offline" },
      ],
    },
    defaults: {
      defaultReportingRegime: "BOTH",
      defaultProfile: { mode: "LITE", preset: "BALANCED" },
      defaultCompliance: {
        type: "WHITELIST",
        regions: ["EU", "CA"],
        allowJobOverride: true,
        enforceDataResidency: true,
        noCrossBorderTransfer: true,
      },
      allowJobOverrideByDefault: true,
    },
    projects: [sampleProject],
    audit: [
      { id: "aud_001", tsISO: SEED_NOW_ISO, actor: "System", action: "Seed data initialized", target: sampleProject.name },
    ],
  };
}
