export type InsightTier = "free" | "plus" | "gold" | "platinum";

export type InsightRealm =
  | "celestial"
  | "mystic"
  | "nature"
  | "knowledge"
  | "explore"
  | "creator"
  | "academy"
  | "wellness"
  | "finance"
  | "community"
  | "dreamscape"
  | "performance"
  | "ai";

export type CouncilSpecialist =
  | "astrology"
  | "dream_symbolism"
  | "tarot"
  | "numerology"
  | "palmistry"
  | "mythology"
  | "mythical_creatures"
  | "spirit_animals"
  | "archetypes"
  | "psychology"
  | "meditation"
  | "philosophy"
  | "comparative_religion"
  | "history"
  | "folklore"
  | "ancient_civilizations"
  | "cultural_studies"
  | "symbolism";

export interface AuthContext {
  userId: string;
  accountId: string;
  authenticated: true;
  sessionId: string;
}

export interface EntitlementContext {
  tier: InsightTier;
  active: boolean;
  features: readonly string[];
  source: "server" | "fallback-deny";
}

export interface PHIARequest {
  requestId: string;
  releaseId: string;
  auth: AuthContext;
  entitlement: EntitlementContext;
  message: string;
  realm?: InsightRealm;
  specialist?: CouncilSpecialist;
  permittedMemoryIds: readonly string[];
  systemPromptVersion: string;
}

export interface PHIAResponse {
  requestId: string;
  releaseId: string;
  text: string;
  realm?: InsightRealm;
  specialist?: CouncilSpecialist;
  persistedMessageId: string;
  auditEventId: string;
}

export interface PHIAProvider {
  generate(request: PHIARequest): Promise<PHIAResponse>;
}

export interface InsightPersistence {
  saveMessage(input: {
    accountId: string;
    requestId: string;
    role: "user" | "assistant";
    content: string;
  }): Promise<{ messageId: string }>;
  saveAuditEvent(input: {
    accountId: string;
    requestId: string;
    type: string;
    metadata?: Record<string, string>;
  }): Promise<{ auditEventId: string }>;
}

export interface EntitlementResolver {
  resolve(accountId: string): Promise<EntitlementContext>;
}

/**
 * PHIA orchestration boundary.
 * Security rule: authentication, authorization, entitlement, and memory scope
 * are resolved server-side before a provider call.
 */
export async function runPHIA(input: {
  auth: AuthContext;
  message: string;
  realm?: InsightRealm;
  specialist?: CouncilSpecialist;
  permittedMemoryIds: readonly string[];
  releaseId: string;
  systemPromptVersion: string;
  entitlementResolver: EntitlementResolver;
  provider: PHIAProvider;
  persistence: InsightPersistence;
}): Promise<PHIAResponse> {
  if (!input.auth.authenticated) throw new Error("AUTH_REQUIRED");
  if (!input.message.trim()) throw new Error("MESSAGE_REQUIRED");

  const entitlement = await input.entitlementResolver.resolve(input.auth.accountId);
  const requestId = crypto.randomUUID();

  const userMessage = await input.persistence.saveMessage({
    accountId: input.auth.accountId,
    requestId,
    role: "user",
    content: input.message,
  });

  const response = await input.provider.generate({
    requestId,
    releaseId: input.releaseId,
    auth: input.auth,
    entitlement,
    message: input.message,
    realm: input.realm,
    specialist: input.specialist,
    permittedMemoryIds: input.permittedMemoryIds,
    systemPromptVersion: input.systemPromptVersion,
  });

  const audit = await input.persistence.saveAuditEvent({
    accountId: input.auth.accountId,
    requestId,
    type: "phia.interaction.completed",
    metadata: {
      userMessageId: userMessage.messageId,
      assistantMessageId: response.persistedMessageId,
      realm: response.realm ?? "unselected",
      specialist: response.specialist ?? "none",
    },
  });

  return { ...response, auditEventId: audit.auditEventId };
}
