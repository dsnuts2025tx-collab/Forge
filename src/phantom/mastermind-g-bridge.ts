/**
 * Canonical translation boundary between G, Mastermind, Phantom, and Forge.
 *
 * This is a coordination contract, not a new authority or foundational primitive.
 * G translates human intent and preserves context; Mastermind reasons and composes;
 * Phantom authorizes/governs and records truth; Forge executes; verification proves.
 */
export type MissionTruth = "DIRECTED" | "DESIRED" | "OBSERVED" | "PROVEN";
export type SystemRole = "G" | "MASTERMIND" | "PHANTOM" | "FORGE" | "VERIFICATION";

export interface MissionEnvelope {
  missionId: string;
  requestId: string;
  source: SystemRole;
  objective: string;
  context?: Record<string, unknown>;
  constraints: string[];
  requiredCapabilities: string[];
  expectedOutcome?: string;
  truth: MissionTruth;
  revision: string;
  createdAt: string;
}

export interface MissionTransition {
  from: SystemRole;
  to: SystemRole;
  action: "TRANSLATE" | "REASON" | "AUTHORIZE" | "EXECUTE" | "VERIFY" | "LEARN";
  missionId: string;
  requestId: string;
  revision: string;
}

const SYSTEMS: readonly SystemRole[] = ["G", "MASTERMIND", "PHANTOM", "FORGE", "VERIFICATION"];
const TRUTHS: readonly MissionTruth[] = ["DIRECTED", "DESIRED", "OBSERVED", "PROVEN"];

export function validateMissionEnvelope(mission: MissionEnvelope): void {
  if (!mission.missionId.trim() || !mission.requestId.trim()) throw new Error("Mission and request identity are required.");
  if (!mission.objective.trim()) throw new Error("Mission objective is required.");
  if (!mission.revision.trim()) throw new Error("Mission revision is required.");
  if (!SYSTEMS.includes(mission.source)) throw new Error("Unknown mission source.");
  if (!TRUTHS.includes(mission.truth)) throw new Error("Unknown mission truth state.");
  if (mission.constraints.some((value) => !value.trim())) throw new Error("Mission constraints must be non-empty.");
  if (mission.requiredCapabilities.some((value) => !value.trim())) throw new Error("Required capabilities must be non-empty.");
}

/**
 * Allowed handoff topology. Execution and authority remain separate by construction.
 */
export function validateTransition(transition: MissionTransition): void {
  const allowed =
    (transition.from === "G" && transition.to === "MASTERMIND" && transition.action === "TRANSLATE") ||
    (transition.from === "MASTERMIND" && transition.to === "PHANTOM" && transition.action === "REASON") ||
    (transition.from === "PHANTOM" && transition.to === "FORGE" && transition.action === "AUTHORIZE") ||
    (transition.from === "FORGE" && transition.to === "VERIFICATION" && transition.action === "EXECUTE") ||
    (transition.from === "VERIFICATION" && transition.to === "PHANTOM" && transition.action === "VERIFY") ||
    (transition.from === "PHANTOM" && transition.to === "MASTERMIND" && transition.action === "LEARN");

  if (!allowed) throw new Error("Unauthorized system transition.");
  if (!transition.missionId.trim() || !transition.requestId.trim() || !transition.revision.trim()) {
    throw new Error("Transition identity is incomplete.");
  }
}

export function createMissionEnvelope(input: Omit<MissionEnvelope, "truth">): MissionEnvelope {
  const mission: MissionEnvelope = { ...input, truth: "DIRECTED" };
  validateMissionEnvelope(mission);
  return mission;
}
