/**
 * Canonical product-launch intent translator for G.
 *
 * G does not deploy or promote products. It turns a human launch command into
 * a deterministic Mastermind mission request. Existing control, execution,
 * verification, and production-release gates remain authoritative.
 */

export type ProductSurface = "WEBSITE" | "APP" | "WEBSITE_AND_APP";
export type LaunchTruth = "DIRECTED";

export interface ProductLaunchMission {
  missionId: string;
  requestId: string;
  source: "G";
  product: string;
  surface: ProductSurface;
  objective: string;
  truth: LaunchTruth;
  requirements: string[];
  completionGates: string[];
  revision: string;
  createdAt: string;
}

const SURFACES: readonly ProductSurface[] = ["WEBSITE", "APP", "WEBSITE_AND_APP"];

const UNIVERSAL_GATES = [
  "hard-state-check",
  "canonical-product-resolution",
  "reuse-and-compose-first",
  "competitive-frontier-assessment",
  "production-quality-implementation",
  "automated-testing",
  "independent-verification",
  "production-deployment",
  "live-health-check",
  "live-smoke-test",
  "customer-journey-verification",
  "observability-and-recovery",
  "durable-evidence",
];

const WEBSITE_REQUIREMENTS = [
  "responsive desktop and mobile experience",
  "accessibility",
  "performance",
  "security and privacy",
  "production reliability",
  "discoverability and SEO where applicable",
];

const APP_REQUIREMENTS = [
  "production application entry",
  "authentication and session behavior where applicable",
  "persistence and data integrity where applicable",
  "security and privacy",
  "production reliability and recovery",
  "core customer journey verification",
];

function clean(value: string, field: string, max = 240): string {
  const result = value.trim();
  if (!result) throw new Error(`${field} is required.`);
  if (result.length > max) throw new Error(`${field} exceeds the ${max}-character limit.`);
  return result;
}

export function createProductLaunchMission(input: {
  missionId: string;
  requestId: string;
  product: string;
  surface: ProductSurface;
  revision: string;
  createdAt?: string;
  additionalRequirements?: string[];
}): ProductLaunchMission {
  const product = clean(input.product, "product");
  const missionId = clean(input.missionId, "missionId", 128);
  const requestId = clean(input.requestId, "requestId", 128);
  const revision = clean(input.revision, "revision", 128);
  if (!SURFACES.includes(input.surface)) throw new Error("Unsupported product surface.");

  const surfaceRequirements = input.surface === "WEBSITE"
    ? WEBSITE_REQUIREMENTS
    : input.surface === "APP"
      ? APP_REQUIREMENTS
      : [...WEBSITE_REQUIREMENTS, ...APP_REQUIREMENTS];

  const requirements = [...new Set([
    "build the strongest validated production-quality experience supported by the authorized architecture and resources",
    "preserve existing canonical work and improve it rather than rebuilding unnecessarily",
    ...surfaceRequirements,
    ...(input.additionalRequirements ?? []).map((value) => clean(value, "additional requirement", 500)),
  ])];

  return {
    missionId,
    requestId,
    source: "G",
    product,
    surface: input.surface,
    objective: `Launch ${product} as a real production ${input.surface.toLowerCase()} and continue improvement after launch while preserving evidence and authority boundaries.`,
    truth: "DIRECTED",
    requirements,
    completionGates: [...UNIVERSAL_GATES],
    revision,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function classifyLaunchCommand(command: string): { product: string; surface: ProductSurface } {
  const normalized = command.trim().replace(/[.!?]+$/, "");
  const match = normalized.match(/^launch\s+(.+?)(?:\s+(website|app|live|production))?$/i);
  if (!match) throw new Error("Expected a launch command such as 'Launch Insight Live' or 'Launch Insight App'.");
  const product = clean(match[1], "product");
  const suffix = (match[2] ?? "").toLowerCase();
  const surface: ProductSurface = suffix === "app" ? "APP" : suffix === "website" ? "WEBSITE" : "WEBSITE_AND_APP";
  return { product, surface };
}
