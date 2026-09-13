import { createDeepResearchDirective, createRouteRecommendation } from "./g-deep-research-standard.ts";

const directive = createDeepResearchDirective({
  directiveId: "research-self-test",
  question: "Determine the best production route.",
});
if (directive.depth !== "DEEP" || !directive.searchEveryRelevantSurface || !directive.compareAlternatives || !directive.challengeAssumptions || !directive.requireCurrentEvidence) throw new Error("Deep research standard failed.");
if (directive.evidenceHierarchy[0] !== "PRIMARY") throw new Error("Evidence hierarchy failed.");

const route = createRouteRecommendation({
  recommendation: "Use the highest-evidence route.",
  rationale: "It minimizes validated delivery time without weakening release gates.",
  fastestValidatedRoute: "Reuse existing canonical capability, then verify.",
  evidenceRequired: ["current implementation state", "independent verification"],
});
if (!route.fastestValidatedRoute || route.evidenceRequired.length !== 2) throw new Error("Route recommendation failed.");

let blocked = false;
try { createRouteRecommendation({ recommendation: "best", rationale: "because", fastestValidatedRoute: "fast", evidenceRequired: [] }); } catch { blocked = true; }
if (!blocked) throw new Error("Unsupported recommendation was not blocked.");

console.log("G deep-research and best-route standard self-test: PASS");
