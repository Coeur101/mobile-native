import fs from "node:fs";
import { getHarnessFilePath, loadHarnessState, writeJson, writeText } from "./shared.mjs";

const state = loadHarnessState();

const featureList = {
  generatedAt: state.generatedAt,
  project: state.project,
  workflowVersion: state.workflowVersion,
  activeChanges: state.activeChanges,
  currentFocus: state.currentFocus,
  nextQueue: state.nextQueue,
  repoBacklog: state.repoBacklog,
  features: state.tasks.map((task) => ({
    id: task.id,
    change: task.change,
    phase: task.phase,
    title: task.title,
    status: task.status,
    priority: task.priority,
    historyRef: task.historyRef,
    requiredChecks: [
      ...(task.artifacts?.functionalTests ?? []),
      ...(task.artifacts?.uiTests ?? []),
      ...(task.artifacts?.buildChecks ?? []),
    ],
  })),
};

const initMd = `# Agent Harness Init

Generated: ${state.generatedAt}
Project: ${state.project}
Branch: ${state.git.branch}
Commit: ${state.git.commit}

## Harness Mapping

- Initializer harness: OpenSpec proposal/design/tasks + \`TASK.json\`
- Feature list: \`.agent-harness/feature-list.json\`
- Progress bridge: task logs + \`.agent-harness/progress.jsonl\`
- E2E verification: Playwright / Vitest / build commands recorded per task

## Session Startup Order

1. Run \`pnpm agent:refresh\`
2. Read \`.agent-harness/session-brief.md\`
3. Read the current focus task's \`mustRead\` files
4. Implement one atomic task
5. Run the recorded verification commands
6. Append a session checkpoint with \`pnpm agent:log -- done <TASK-ID> "..."\`

## Current Focus

${state.currentFocus ? `- ${state.currentFocus.id}: ${state.currentFocus.title}` : "- None"}
${state.currentFocus ? `- Change: ${state.currentFocus.change}` : ""}
${state.currentFocus ? `- Required checks: ${state.currentFocus.requiredChecks.join(" | ") || "None"}` : ""}

## Repo Backlog Signals

${state.repoBacklog.map((item) => `- ${item.title} (${item.source})`).join("\n") || "- None"}
`;

writeJson(getHarnessFilePath("feature-list.json"), featureList);
writeText(getHarnessFilePath("init.md"), initMd);

const progressPath = getHarnessFilePath("progress.jsonl");
if (!fs.existsSync(progressPath)) {
  writeText(progressPath, "");
}

console.log(`Initialized agent harness in ${getHarnessFilePath("init.md")}`);

