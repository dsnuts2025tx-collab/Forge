import { classifyLaunchCommand, createProductLaunchMission } from "./g-product-launch.ts";

const classified = classifyLaunchCommand("Launch Insight Live.");
if (classified.product !== "Insight" || classified.surface !== "WEBSITE_AND_APP") throw new Error("Launch command classification failed.");

const website = createProductLaunchMission({ missionId: "insight-web", requestId: "req-web", product: classified.product, surface: "WEBSITE", revision: "self-test-1" });
if (website.source !== "G" || website.truth !== "DIRECTED") throw new Error("G launch provenance failed.");
if (!website.completionGates.includes("live-smoke-test")) throw new Error("Live smoke gate missing.");
if (!website.requirements.includes("accessibility")) throw new Error("Website quality requirement missing.");

const app = createProductLaunchMission({ missionId: "insight-app", requestId: "req-app", product: "Insight", surface: "APP", revision: "self-test-1" });
if (!app.requirements.includes("authentication and session behavior where applicable")) throw new Error("App requirement missing.");
if (app.requirements.includes("discoverability and SEO where applicable")) throw new Error("App-only mission incorrectly inherited website-only requirement.");

console.log("G product launch translator self-test: PASS");
