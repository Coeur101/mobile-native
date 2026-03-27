import { getHarnessFilePath, loadHarnessState, writeJson } from "./shared.mjs";

const state = loadHarnessState();

const orchestration = {
  generatedAt: state.generatedAt,
  currentFocus: state.currentFocus,
  whySelected: state.currentFocus
    ? state.currentFocus.status === "in_progress"
      ? "Continue the current in-progress task in the most active change."
      : "Pick the highest-priority actionable task from the most active change."
    : "No actionable tasks remain.",
  mustRead: state.currentFocus?.mustRead ?? [],
  mustVerify: state.currentFocus?.requiredChecks ?? [],
  nextQueue: state.nextQueue,
  repoBacklog: state.repoBacklog,
};

writeJson(getHarnessFilePath("orchestration.json"), orchestration);
console.log(JSON.stringify(orchestration, null, 2));
