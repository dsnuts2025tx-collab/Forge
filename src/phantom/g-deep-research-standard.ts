export type EvidenceKind = "PRIMARY" | "REPOSITORY" | "RUNTIME" | "TEST" | "BENCHMARK" | "SECONDARY" | "INFERENCE";
export type RecommendationPriority = "CRITICAL" | "HIGH" | "NORMAL" | "OPTIONAL";

export interface ResearchDirective {
  directiveId: string;
  question: string;
  objective: string;
  depth: "DEEP";
  searchEveryRelevantSurface: true;
  compareAlternatives: true;
  challengeAssumptions: true;
  requireCurrentEvidence: true;
  evidenceHierarchy: EvidenceKind[];
  output: "FACTS_AND_RECOMMENDATION";
}

export interface RouteRecommendation {
  recommendation: string;
  priority: RecommendationPriority;
  rationale: string;
  evidenceRequired: string[];
  fastestValidatedRoute: string;
  risks: string[];
}

const EVIDENCE_HIERARCHY: EvidenceKind[] = ["PRIMARY", "REPOSITORY", "RUNTIME", "TEST", "BENCHMARK", "SECONDARY", "INFERENCE"];

function required(value: string, field: string, max = 1000): string {
  const result = value.trim();
  if (!result) throw new Error(`${field} is required.`);
  if (result.length > max) throw new Error(`${field} exceeds the ${max}-character limit.`);
  return result;
}

/**
 * Canonical G research directive. This defines the quality of investigation,
 * not a claim that research has already been performed.
 */
export function createDeepResearchDirective(input: {
  directiveId: string;
  question: string;
  objective?: string;
}): ResearchDirective {
  return {
    directiveId: required(input.directiveId, "directiveId", 128),
    question: required(input.question, "question"),
    objective: required(input.objective ?? input.question, "objective"),
    depth: "DEEP",
    searchEveryRelevantSurface: true,
    compareAlternatives: true,
    challengeAssumptions: true,
    requireCurrentEvidence: true,
    evidenceHierarchy: [...EVIDENCE_HIERARCHY],
    output: "FACTS_AND_RECOMMENDATION",
  };
}

/**
 * Prevents G from presenting an unsupported "best" or "fastest" claim.
 * The caller must supply evidence-backed reasoning before a recommendation
 * can be promoted to a factual conclusion.
 */
export function createRouteRecommendation(input: {
  recommendation: string;
  rationale: string;
  fastestValidatedRoute: string;
  evidenceRequired: string[];
  risks?: string[];
  priority?: RecommendationPriority;
}): RouteRecommendation {
  if (!input.evidenceRequired.length) throw new Error("A route recommendation requires evidence criteria.");
  return {
    recommendation: required(input.recommendation, "recommendation"),
    priority: input.priority ?? "HIGH",
    rationale: required(input.rationale, "rationale"),
    evidenceRequired: input.evidenceRequired.map((value) => required(value, "evidence criterion", 500)),
    fastestValidatedRoute: required(input.fastestValidatedRoute, "fastestValidatedRoute"),
    risks: (input.risks ?? []).map((value) => required(value, "risk", 500)),
  };
}
