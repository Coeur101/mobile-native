import { getHarnessFilePath, loadHarnessState, writeJson, writeText } from "./shared.mjs";

const state = loadHarnessState();

const featureList = {
  generatedAt: state.generatedAt,
  activeChanges: state.activeChanges,
  currentFocus: state.currentFocus,
  nextQueue: state.nextQueue,
  repoBacklog: state.repoBacklog,
};

const sessionBrief = `# Session Brief

Generated: ${state.generatedAt}
Branch: ${state.git.branch}
Commit: ${state.git.commit}

## Current Focus

${state.currentFocus ? `- Task: ${state.currentFocus.id}` : "- Task: None"}
${state.currentFocus ? `- Title: ${state.currentFocus.title}` : ""}
${state.currentFocus ? `- Change: ${state.currentFocus.change}` : ""}
${state.currentFocus ? `- Phase: ${state.currentFocus.phase}` : ""}
${state.currentFocus ? `- Why selected: active in-progress change with highest-priority pending task` : ""}

## Must Read

${state.currentFocus?.mustRead?.map((file) => `- ${file}`).join("\n") || "- None"}

## Must Verify

${state.currentFocus?.requiredChecks?.map((command) => `- ${command}`).join("\n") || "- None"}

## Next Queue

${state.nextQueue.map((task) => `- ${task.id} [${task.phase}/${task.priority}] ${task.title}`).join("\n") || "- None"}

## Recent Completed

${state.recentCompleted.map((task) => `- ${task.id} ${task.title} (${task.status})`).join("\n") || "- None"}

## Repo Backlog

${state.repoBacklog.map((item) => `- ${item.title}: ${item.recommendation}`).join("\n") || "- None"}
`;

writeJson(getHarnessFilePath("feature-list.json"), featureList);
writeText(getHarnessFilePath("session-brief.md"), sessionBrief);

console.log(`Refreshed session brief at ${getHarnessFilePath("session-brief.md")}`);

