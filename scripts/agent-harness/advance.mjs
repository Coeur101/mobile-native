import {
  appendHarnessProgress,
  appendTaskHistory,
  cleanupTaskArtifacts,
  getHarnessFilePath,
  loadHarnessState,
  updateTaskStatus,
  writeClaimedTask,
  writeJson,
  writeText,
} from "./shared.mjs";

const [, , taskId, summary = "Task completed."] = process.argv;
if (!taskId) {
  throw new Error(
    'Usage: node scripts/agent-harness/advance.mjs <taskId> "<summary>" [--status <status>] [--verification <text>] [--next <text>] [--cleanup true|false]',
  );
}

const flags = new Map();
for (let index = 4; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1] ?? "";
  if (key?.startsWith("--")) {
    flags.set(key.slice(2), value);
  }
}

const nextStatus = flags.get("status") ?? "docs_verified";
const verification = flags.get("verification") ?? "";
const nextStep = flags.get("next") ?? "";
const shouldCleanup = (flags.get("cleanup") ?? "true") !== "false";

const updatedTask = updateTaskStatus(taskId, nextStatus);
const removedArtifacts = shouldCleanup ? cleanupTaskArtifacts() : [];

appendTaskHistory(taskId, {
  step: "task_advanced",
  fromStatus: updatedTask.previousStatus,
  toStatus: updatedTask.status,
  summary,
  evidenceType: "task_progress",
  evidenceRef: verification || "pnpm agent:advance",
  result: "success",
  blockers: removedArtifacts.length > 0
    ? [`Context cleanup removed: ${removedArtifacts.join(", ")}`]
    : [],
});

appendHarnessProgress({
  timestamp: new Date().toISOString(),
  event: "done",
  taskId,
  summary,
  verification,
  nextStep,
  status: nextStatus,
  cleanup: {
    enabled: shouldCleanup,
    removedArtifacts,
  },
});

const candidateState = loadHarnessState();
let claimedTask = candidateState.currentFocus;
let claimMode = claimedTask ? "resume" : "idle";

if (claimedTask?.status === "todo") {
  const startedTask = updateTaskStatus(claimedTask.id, "in_progress");
  appendTaskHistory(startedTask.id, {
    step: "task_claimed",
    fromStatus: startedTask.previousStatus,
    toStatus: startedTask.status,
    summary: nextStep || `Claimed ${startedTask.id} for continuous execution.`,
    evidenceType: "task_progress",
    evidenceRef: "pnpm agent:advance",
    result: "success",
    blockers: [],
  });
  claimMode = "claimed";
}

const state = loadHarnessState();
claimedTask = state.currentFocus;

if (claimedTask) {
  appendHarnessProgress({
    timestamp: new Date().toISOString(),
    event: claimMode === "claimed" ? "start" : "resume",
    taskId: claimedTask.id,
    summary:
      nextStep ||
      (claimMode === "claimed"
        ? `Claimed ${claimedTask.id} for continuous execution.`
        : `Resumed ${claimedTask.id} as the active focus.`),
    verification: "",
    nextStep: claimedTask.mustRead?.[0] ?? "Read mustRead context and start implementation.",
    status: claimedTask.status,
  });
}

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

const sessionBrief = `# Session Brief

Generated: ${state.generatedAt}
Branch: ${state.git.branch}
Commit: ${state.git.commit}

## Just Completed

- Task: ${updatedTask.id}
- Status: ${updatedTask.status}
- Summary: ${summary}
- Verification: ${verification || "None recorded"}

## Current Focus

${state.currentFocus ? `- Task: ${state.currentFocus.id}` : "- Task: None"}
${state.currentFocus ? `- Title: ${state.currentFocus.title}` : ""}
${state.currentFocus ? `- Change: ${state.currentFocus.change}` : ""}
${state.currentFocus ? `- Phase: ${state.currentFocus.phase}` : ""}
${state.currentFocus ? `- Status: ${state.currentFocus.status}` : ""}

## Must Read

${state.currentFocus?.mustRead?.map((file) => `- ${file}`).join("\n") || "- None"}

## Must Verify

${state.currentFocus?.requiredChecks?.map((command) => `- ${command}`).join("\n") || "- None"}

## Next Queue

${state.nextQueue.map((task) => `- ${task.id} [${task.status}/${task.phase}/${task.priority}] ${task.title}`).join("\n") || "- None"}

## Cleanup

${shouldCleanup ? `- Removed tracked temp outputs: ${removedArtifacts.join(", ") || "None"}` : "- Cleanup skipped"}
`;

const orchestration = {
  generatedAt: state.generatedAt,
  justCompleted: {
    id: updatedTask.id,
    status: updatedTask.status,
    summary,
    verification,
  },
  currentFocus: state.currentFocus,
  whySelected: state.currentFocus
    ? claimMode === "claimed"
      ? "Automatically claimed the next actionable task after finishing the previous one."
      : "Continuing the already active in-progress task after advancing the previous one."
    : "No actionable tasks remain.",
  mustRead: state.currentFocus?.mustRead ?? [],
  mustVerify: state.currentFocus?.requiredChecks ?? [],
  nextQueue: state.nextQueue,
  repoBacklog: state.repoBacklog,
};

writeJson(getHarnessFilePath("feature-list.json"), featureList);
writeText(getHarnessFilePath("session-brief.md"), sessionBrief);
writeJson(getHarnessFilePath("orchestration.json"), orchestration);
writeClaimedTask(state.currentFocus);

console.log(
  JSON.stringify(
    {
      completed: {
        id: updatedTask.id,
        status: updatedTask.status,
        previousStatus: updatedTask.previousStatus,
      },
      claimedNext: state.currentFocus
        ? {
            id: state.currentFocus.id,
            title: state.currentFocus.title,
            status: state.currentFocus.status,
            mode: claimMode,
          }
        : null,
      cleanup: {
        enabled: shouldCleanup,
        removedArtifacts,
      },
    },
    null,
    2,
  ),
);
