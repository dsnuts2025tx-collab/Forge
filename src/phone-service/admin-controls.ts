export type PhoneServiceMode = "ENABLED" | "SUSPENDED" | "DRAINING";

export type AdminControlState = {
  mode: PhoneServiceMode;
  reason: string | null;
  changedAt: string;
  changedBy: string;
};

export type AdminControlStore = {
  read(): AdminControlState;
  write(next: AdminControlState): void;
};

export type AdminCommand =
  | { type: "SUSPEND"; actor: string; reason: string; now?: string }
  | { type: "RESUME"; actor: string; now?: string }
  | { type: "DRAIN"; actor: string; reason: string; now?: string };

const validActor = (actor: string): boolean => actor.trim().length >= 2;
const validReason = (reason: string): boolean => reason.trim().length >= 3;

export function applyAdminCommand(store: AdminControlStore, command: AdminCommand): AdminControlState {
  if (!validActor(command.actor)) throw new Error("admin actor is required");

  const now = command.now ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(now))) throw new Error("admin timestamp is invalid");

  if (command.type === "RESUME") {
    const next: AdminControlState = {
      mode: "ENABLED",
      reason: null,
      changedAt: now,
      changedBy: command.actor.trim(),
    };
    store.write(next);
    return next;
  }

  if (!validReason(command.reason)) throw new Error("admin reason is required");

  const next: AdminControlState = {
    mode: command.type === "DRAIN" ? "DRAINING" : "SUSPENDED",
    reason: command.reason.trim(),
    changedAt: now,
    changedBy: command.actor.trim(),
  };
  store.write(next);
  return next;
}

export function canProvisionNewService(state: AdminControlState): boolean {
  return state.mode === "ENABLED";
}

export function canKeepExistingService(state: AdminControlState): boolean {
  return state.mode !== "SUSPENDED";
}
