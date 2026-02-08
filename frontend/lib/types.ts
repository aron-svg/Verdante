export type ReportingRegime = "CANADA" | "EU" | "BOTH";
export type SettingsMode = "LITE" | "FULL";
export type LitePreset = "GREENEST" | "CHEAPEST" | "FASTEST" | "BALANCED";

export type JobType = "TRAINING" | "BATCH" | "CI" | "ETL" | "INFERENCE" | "CUSTOM";
export type JobPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CompliancePolicyType = "WHITELIST" | "BLACKLIST";

export interface Workspace {
  id: string;
  name: string;
  membersMock: Array<{ name: string; role: "Owner" | "Editor" | "Viewer"; presence: "editing" | "viewing" | "offline" }>;
}

export interface ObjectiveWeights {
  co2: number;   // 0..100
  cost: number;  // 0..100
  time: number;  // 0..100
  power: number; // 0..100
}

export interface HardConstraints {
  maxBudgetUsd?: number;
  maxCO2Kg?: number;
  maxPowerKw?: number;
  maxRuntimeHours?: number;
}

export interface SchedulingConstraints {
  deadlineISO?: string;
  earliestStartISO?: string;
  batchableShiftable: boolean;
}

export interface ProviderConstraints {
  allowedProviders: string[];
  allowedInstanceFamilies: string[];
}

export interface DataHandlingToggles {
  enforceDataResidency: boolean;
  noCrossBorderTransfer: boolean;
}

export interface OptimizationProfileLite {
  mode: "LITE";
  preset: LitePreset;
}

export interface OptimizationProfileFull {
  mode: "FULL";
  weights: ObjectiveWeights;
  hard?: HardConstraints;
  scheduling?: SchedulingConstraints;
  provider?: ProviderConstraints;
  dataHandling?: DataHandlingToggles;
}

export type OptimizationProfile = OptimizationProfileLite | OptimizationProfileFull;

export interface CompliancePolicy {
  type: CompliancePolicyType;
  regions: string[];
  allowJobOverride: boolean;
  enforceDataResidency: boolean;
  noCrossBorderTransfer: boolean;
}

export interface Estimates {
  maxCostUsd: number;
  maxCO2Kg: number;
  maxPowerKw: number;
  maxTimeHours: number;
  confidence: "LOW" | "MED" | "HIGH";
  assumptions: string[];
}

export interface JobCompute {
  gpuRequired: boolean;
  gpuClass: "T4" | "L4" | "A10" | "A100" | "H100" | "NONE";
  expectedRuntimeHours: number;
}

export interface Job {
  id: string;
  name: string;
  type: JobType;
  priority: JobPriority;
  deadlineISO?: string;
  batchableShiftable: boolean;

  compute: JobCompute;

  inheritProjectSettings: boolean;
  overrideProfile?: OptimizationProfile;

  inheritCompliance: boolean;
  overrideCompliance?: CompliancePolicy;

  status: "IDLE" | "QUEUED" | "RUNNING" | "DONE";
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tags: string[];

  reportingRegime: ReportingRegime;

  profile: OptimizationProfile;
  compliance: CompliancePolicy;

  jobs: Job[];

  seedEstimates?: { perJob: Record<string, Estimates>; projectTotals: Estimates };
}

export interface UserDefaults {
  defaultReportingRegime: ReportingRegime;
  defaultProfile: OptimizationProfile;
  defaultCompliance: CompliancePolicy;
  allowJobOverrideByDefault: boolean;
}

export interface AuditEntry {
  id: string;
  tsISO: string;
  actor: string;
  action: string;
  target: string;
}

export interface RunJobActuals {
  jobId: string;
  actualCostUsd: number;
  actualCO2Kg: number;
  actualPowerKw: number;
  actualTimeHours: number;
  region: string;
  provider: string;
  timeWindowLabel: string;
  rationaleTags: string[];
}

export interface RunResult {
  id: string;
  projectId: string;
  tsISO: string;
  regime: ReportingRegime;
  jobs: RunJobActuals[];
  logs: string[];
}

export interface AppState {
  version: 1;
  workspace: Workspace;
  defaults: UserDefaults;
  projects: Project[];
  audit: AuditEntry[];
}
