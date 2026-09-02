export type Risk = "low" | "medium" | "high" | "critical";

export interface MastermindDirective {
  directiveId: string;
  objective: string;
  constraints: string[];
  prohibitedActions: string[];
  requestedCapabilities: string[];
  priority: Risk;
  source: "user";
  authority: "Phantom Mastermind";
  pathway: "Phantom Pathway";
  requiresVerification: true;
}

const NEGATIONS = /\b(do not|don't|never|no|without|private|locked|must not|cannot)\b/gi;

function safeText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ").trim();
}

function extractConstraints(input: string): string[] {
  return input
    .split(/[.!?\n]+/)
    .map(safeText)
    .filter(Boolean)
    .filter((s) => NEGATIONS.test(s) || /\b(must|required|lock|preserve|only)\b/i.test(s));
}

function inferCapabilities(input: string): string[] {
  const text = input.toLowerCase();
  const capabilities = new Set<string>();

  if (/bug|broken|fix|diagnos|issue|problem|error|failure|detect/.test(text)) {
    capabilities.add("engineering.detective");
  }
  if (/emergency|urgent|immediately|critical|outage|down|restore/.test(text)) {
    capabilities.add("engineering.emt");
  }
  if (/memory|remember|history|knowledge|context|all we have/.test(text)) {
    capabilities.add("memory.fabric");
  }
  if (/deploy|release|production|live|runtime/.test(text)) {
    capabilities.add("production.operations");
  }
  if (/tool|worker|execute|connector|mcp|gadget/.test(text)) {
    capabilities.add("gadget.fabric");
  }

  return [...capabilities];
}

function inferPriority(input: string): Risk {
  const text = input.toLowerCase();
  if (/emergency|critical|outage|security incident|data loss/.test(text)) return "critical";
  if (/urgent|production|deploy|live|public/.test(text)) return "high";
  if (/fix|build|change|update/.test(text)) return "medium";
  return "low";
}

export function translateToMastermind(input: string): MastermindDirective {
  const clean = safeText(input);
  if (!clean) throw new Error("MASTERmind_TRANSLATOR_REJECTED: empty user intent");

  return {
    directiveId: `mi_${crypto.randomUUID()}`,
    objective: clean,
    constraints: extractConstraints(clean),
    prohibitedActions: extractConstraints(clean).filter((s) => NEGATIONS.test(s)),
    requestedCapabilities: inferCapabilities(clean),
    priority: inferPriority(clean),
    source: "user",
    authority: "Phantom Mastermind",
    pathway: "Phantom Pathway",
    requiresVerification: true
  };
}
