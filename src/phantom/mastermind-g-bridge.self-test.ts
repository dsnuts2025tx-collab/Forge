import {
  createMissionEnvelope,
  validateMissionEnvelope,
  validateTransition,
  type MissionTransition,
} from "./mastermind-g-bridge.ts";

const mission = createMissionEnvelope({
  missionId: "mission_self_test",
  requestId: "request_self_test",
  source: "G",
  objective: "Exercise the canonical four-system handoff.",
  context: { test: true },
  constraints: ["preserve authority boundaries"],
  requiredCapabilities: ["translation", "execution", "verification"],
  expectedOutcome: "A traceable, verifiable mission lifecycle.",
  revision: "self-test-1",
  createdAt: new Date().toISOString(),
});

validateMissionEnvelope(mission);

const transitions: MissionTransition[] = [
  { from: "G", to: "MASTERMIND", action: "TRANSLATE", missionId: mission.missionId, requestId: mission.requestId, revision: mission.revision },
  { from: "MASTERMIND", to: "PHANTOM", action: "REASON", missionId: mission.missionId, requestId: mission.requestId, revision: mission.revision },
  { from: "PHANTOM", to: "FORGE", action: "AUTHORIZE", missionId: mission.missionId, requestId: mission.requestId, revision: mission.revision },
  { from: "FORGE", to: "VERIFICATION", action: "EXECUTE", missionId: mission.missionId, requestId: mission.requestId, revision: mission.revision },
  { from: "VERIFICATION", to: "PHANTOM", action: "VERIFY", missionId: mission.missionId, requestId: mission.requestId, revision: mission.revision },
  { from: "PHANTOM", to: "MASTERMIND", action: "LEARN", missionId: mission.missionId, requestId: mission.requestId, revision: mission.revision },
];
for (const transition of transitions) validateTransition(transition);

let blocked = false;
try {
  validateTransition({ ...transitions[0], from: "G", to: "FORGE", action: "AUTHORIZE" });
} catch {
  blocked = true;
}
if (!blocked) throw new Error("Bridge self-test failed to block an unauthorized handoff.");

console.log("Phantom G↔Mastermind↔Phantom↔Forge translation boundary self-test: PASS");
