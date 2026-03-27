import fs from "node:fs";
import { getHarnessFilePath } from "./shared.mjs";

const [, , event = "checkpoint", taskId = "UNSCOPED", summary = ""] = process.argv;
const flags = new Map();

for (let index = 5; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1] ?? "";
  if (key?.startsWith("--")) {
    flags.set(key.slice(2), value);
  }
}

const entry = {
  timestamp: new Date().toISOString(),
  event,
  taskId,
  summary,
  verification: flags.get("verification") ?? "",
  nextStep: flags.get("next") ?? "",
};

fs.appendFileSync(getHarnessFilePath("progress.jsonl"), JSON.stringify(entry) + "\n", "utf8");
console.log(`Logged ${event} for ${taskId}`);

