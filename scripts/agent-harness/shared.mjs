import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");
export const harnessDir = path.join(repoRoot, ".agent-harness");
const openspecChangesDir = path.join(repoRoot, "openspec", "changes");
const taskLedgerPath = path.join(repoRoot, "TASK.json");
const tmpDir = path.join(repoRoot, ".tmp");

const priorityRank = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

const phaseRank = {
  definition: 0,
  delivery: 1,
  closure: 2,
};

const completionStatus = new Set(["done", "docs_verified"]);
const actionableStatus = new Set(["todo", "in_progress"]);
const actionableStatusRank = {
  in_progress: 0,
  todo: 1,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removePath(targetPath) {
  if (!exists(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function walkFiles(dirPath, matcher, results = []) {
  if (!exists(dirPath)) {
    return results;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, results);
      continue;
    }

    if (!matcher || matcher(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function fromRepoPath(repoPath) {
  return path.join(repoRoot, repoPath.replace(/\//g, path.sep));
}

function parseTaskNumber(taskId) {
  const match = /TASK-(\d+)/.exec(taskId);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function parseDate(value) {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isLikelyMojibake(value) {
  if (typeof value !== "string") {
    return false;
  }

  const text = value.trim();
  if (!text) {
    return false;
  }

  const suspiciousChars = "鐧璁鍚鏂闂閿绗绔妯璇绱缁缂鍔閲椤轰韩浣犲緱鎵岃瘉鏍锋満";
  let suspiciousCount = 0;
  for (const char of text) {
    if (suspiciousChars.includes(char)) {
      suspiciousCount += 1;
    }
  }

  return suspiciousCount >= 3 && suspiciousCount / text.length >= 0.25;
}

function toReadableTaskTitle(task) {
  const title = task?.title;
  if (!title) {
    return "Title unavailable";
  }

  if (isLikelyMojibake(title)) {
    return "Title unavailable (source text encoding corrupted)";
  }

  return title;
}

function readJsonl(filePath) {
  if (!exists(filePath)) {
    return [];
  }

  return readText(filePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function compareTasks(a, b) {
  const phaseDelta = (phaseRank[a.phase] ?? 99) - (phaseRank[b.phase] ?? 99);
  if (phaseDelta !== 0) return phaseDelta;

  const priorityDelta = (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
  if (priorityDelta !== 0) return priorityDelta;

  return parseTaskNumber(a.id) - parseTaskNumber(b.id);
}

function compareActionableTasks(a, b) {
  const statusDelta =
    (actionableStatusRank[a.status] ?? 99) - (actionableStatusRank[b.status] ?? 99);
  if (statusDelta !== 0) return statusDelta;

  return compareTasks(a, b);
}

function getGitHead() {
  const headPath = path.join(repoRoot, ".git", "HEAD");
  if (!exists(headPath)) {
    return {
      branch: "unknown",
      commit: "unknown",
    };
  }

  const head = readText(headPath).trim();
  if (!head.startsWith("ref: ")) {
    return {
      branch: "detached",
      commit: head.slice(0, 7),
    };
  }

  const ref = head.slice(5);
  const refPath = path.join(repoRoot, ".git", ref.replace(/\//g, path.sep));
  const commit = exists(refPath) ? readText(refPath).trim().slice(0, 7) : "unknown";

  return {
    branch: ref.split("/").at(-1) ?? "unknown",
    commit,
  };
}

function getActiveChangeNames() {
  if (!exists(openspecChangesDir)) {
    return [];
  }

  return fs
    .readdirSync(openspecChangesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => entry.name)
    .sort();
}

function getChangeContextFiles(changeName) {
  const changeDir = path.join(openspecChangesDir, changeName);
  if (!exists(changeDir)) {
    return [];
  }

  const explicit = ["proposal.md", "design.md", "tasks.md", ".openspec.yaml"]
    .map((file) => path.join(changeDir, file))
    .filter(exists)
    .map(toRepoPath);

  const specs = walkFiles(path.join(changeDir, "specs"), (file) => file.endsWith(".md")).map(
    toRepoPath,
  );

  return [...new Set([...explicit, ...specs])];
}

function getTasksByChange(tasks) {
  return tasks.reduce((accumulator, task) => {
    if (!accumulator[task.change]) {
      accumulator[task.change] = [];
    }
    accumulator[task.change].push(task);
    return accumulator;
  }, {});
}

function getRecentTaskEvent(task) {
  const historyPath = fromRepoPath(task.historyRef ?? "");
  const events = readJsonl(historyPath);
  return events.at(-1) ?? null;
}

function detectRepoBacklog(tasks, activeChanges) {
  const backlog = [];
  const tasksByChange = getTasksByChange(tasks);

  for (const changeName of activeChanges) {
    if (!tasksByChange[changeName]) {
      backlog.push({
        id: `backlog:change:${changeName}`,
        kind: "stale_change",
        title: `Active change missing TASK.json mapping: ${changeName}`,
        source: `openspec/changes/${changeName}`,
        recommendation: "Add TASK.json entries, then decide whether to continue delivery or archive the change.",
      });
    }
  }

  const mockCandidates = [
    {
      id: "backlog:mock-project-service",
      title: "Project data still depends on a mock service",
      source: "src/services/project/mock-project-service.ts",
      recommendation: "Create a new change to replace the project mock with a real persistence boundary.",
    },
    {
      id: "backlog:mock-ai-service",
      title: "AI generation still depends on a mock service",
      source: "src/services/ai/mock-ai-service.ts",
      recommendation: "Create a new change to replace the AI mock with a real model integration.",
    },
  ];

  for (const item of mockCandidates) {
    if (exists(path.join(repoRoot, item.source))) {
      backlog.push({
        ...item,
        kind: "mock_boundary",
      });
    }
  }

  const settingsPage = path.join(repoRoot, "src", "pages", "settings", "SettingsPage.tsx");
  if (exists(settingsPage) && readText(settingsPage).includes("mockSettingsService")) {
    backlog.push({
      id: "backlog:settings-local-only",
      kind: "local_only_boundary",
      title: "Settings page still depends on local mock settings",
      source: "src/pages/settings/SettingsPage.tsx",
      recommendation: "Decide whether the profile/settings work should also introduce a real settings backend boundary.",
    });
  }

  return backlog;
}

function getPreferredChange(tasks, activeChanges) {
  const tasksByChange = getTasksByChange(tasks);
  const candidates = activeChanges
    .map((changeName) => {
      const changeTasks = tasksByChange[changeName] ?? [];
      const actionableTasks = changeTasks.filter((task) => actionableStatus.has(task.status));
      if (actionableTasks.length === 0) {
        return null;
      }

      return {
        changeName,
        actionableTasks,
        completedCount: changeTasks.filter((task) => completionStatus.has(task.status)).length,
        updatedAt: Math.max(...changeTasks.map((task) => parseDate(task.updatedAt))),
      };
    })
    .filter(Boolean);

  candidates.sort((a, b) => {
    const updatedDelta = b.updatedAt - a.updatedAt;
    if (updatedDelta !== 0) return updatedDelta;

    const completedDelta = b.completedCount - a.completedCount;
    if (completedDelta !== 0) return completedDelta;

    return a.changeName.localeCompare(b.changeName);
  });

  return candidates[0] ?? null;
}

function getMustRead(task, changeName) {
  const files = [
    ...getChangeContextFiles(changeName),
    ...(task.docsToUpdate ?? []),
    task.historyRef,
  ].filter(Boolean);

  return [...new Set(files)];
}

export function loadHarnessState() {
  ensureDir(harnessDir);

  const ledger = readJson(taskLedgerPath);
  const tasks = [...ledger.tasks];
  const activeChanges = getActiveChangeNames();
  const preferredChange = getPreferredChange(tasks, activeChanges);
  const nextQueue = preferredChange
    ? [...preferredChange.actionableTasks].sort(compareActionableTasks)
    : [...tasks.filter((task) => actionableStatus.has(task.status))].sort(compareActionableTasks);
  const currentFocus = nextQueue[0] ?? null;
  const recentCompleted = tasks
    .filter((task) => completionStatus.has(task.status))
    .sort((a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      change: task.change,
      title: toReadableTaskTitle(task),
      status: task.status,
      updatedAt: task.updatedAt,
      lastEvent: getRecentTaskEvent(task),
    }));
  const repoBacklog = detectRepoBacklog(tasks, activeChanges);
  const git = getGitHead();

  return {
    generatedAt: new Date().toISOString(),
    project: ledger.project,
    workflowVersion: ledger.workflowVersion,
    git,
    activeChanges,
    currentFocus: currentFocus
      ? {
          ...currentFocus,
          title: toReadableTaskTitle(currentFocus),
          mustRead: getMustRead(currentFocus, currentFocus.change),
          requiredChecks: [
            ...(currentFocus.artifacts?.functionalTests ?? []),
            ...(currentFocus.artifacts?.uiTests ?? []),
            ...(currentFocus.artifacts?.buildChecks ?? []),
          ],
        }
      : null,
    nextQueue: nextQueue.slice(0, 8).map((task) => ({
      id: task.id,
      change: task.change,
      phase: task.phase,
      priority: task.priority,
      status: task.status,
      title: toReadableTaskTitle(task),
    })),
    recentCompleted,
    repoBacklog,
    tasks,
    ledger,
  };
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

export function getHarnessFilePath(fileName) {
  return path.join(harnessDir, fileName);
}


export function loadTaskLedger() {
  return readJson(taskLedgerPath);
}

export function saveTaskLedger(ledger) {
  writeJson(taskLedgerPath, ledger);
}

export function updateTaskStatus(taskId, nextStatus) {
  const ledger = loadTaskLedger();
  const task = ledger.tasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const previousStatus = task.status;
  task.status = nextStatus;
  task.updatedAt = new Date().toISOString();
  ledger.updatedAt = task.updatedAt;
  saveTaskLedger(ledger);

  return {
    ...task,
    previousStatus,
  };
}

export function cleanupTaskArtifacts() {
  const removed = [];
  const trackedTargets = [
    path.join(repoRoot, "test-results"),
    path.join(repoRoot, "playwright-report"),
    path.join(tmpDir, "task-runs", "playwright"),
    path.join(tmpDir, "task-runs", "vitest"),
  ];

  for (const targetPath of trackedTargets) {
    if (!exists(targetPath)) {
      continue;
    }

    removePath(targetPath);
    removed.push(toRepoPath(targetPath));
  }

  if (!exists(tmpDir)) {
    return removed;
  }

  for (const entry of fs.readdirSync(tmpDir, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    if (!/^playwright-.*\.(out|err)$/i.test(entry.name)) {
      continue;
    }

    const fullPath = path.join(tmpDir, entry.name);
    try {
      fs.rmSync(fullPath, { force: true });
      removed.push(toRepoPath(fullPath));
    } catch {
      // Ignore locked temp files.
    }
  }

  return removed;
}

export function writeClaimedTask(task) {
  writeJson(getHarnessFilePath("claimed-task.json"), {
    claimedAt: new Date().toISOString(),
    task,
  });
}

export function appendHarnessProgress(entry) {
  fs.appendFileSync(getHarnessFilePath("progress.jsonl"), JSON.stringify(entry) + "\n", "utf8");
}

export function appendTaskHistory(taskId, entry) {
  const ledger = loadTaskLedger();
  const task = ledger.tasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  if (!task.historyRef) {
    return null;
  }

  const historyPath = fromRepoPath(task.historyRef);
  ensureDir(path.dirname(historyPath));

  const existingEntries = readJsonl(historyPath);
  const eventId = `${taskId}-E${String(existingEntries.length + 1).padStart(3, "0")}`;
  const historyEntry = {
    eventId,
    taskId,
    timestamp: new Date().toISOString(),
    actor: "codex",
    ...entry,
  };

  fs.appendFileSync(historyPath, JSON.stringify(historyEntry) + "\n", "utf8");
  return historyEntry;
}








