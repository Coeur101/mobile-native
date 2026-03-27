import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");
export const harnessDir = path.join(repoRoot, ".agent-harness");
const openspecChangesDir = path.join(repoRoot, "openspec", "changes");
const taskLedgerPath = path.join(repoRoot, "TASK.json");

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
        title: `活跃 change 缺少 TASK.json 任务映射：${changeName}`,
        source: `openspec/changes/${changeName}`,
        recommendation: "补齐 TASK.json、判断继续交付还是归档/废弃。",
      });
    }
  }

  const mockCandidates = [
    {
      id: "backlog:mock-project-service",
      title: "项目数据仍以 mock service 为主",
      source: "src/services/project/mock-project-service.ts",
      recommendation: "为真实云端项目持久化建立新 change。",
    },
    {
      id: "backlog:mock-ai-service",
      title: "AI 生成仍以 mock service 为主",
      source: "src/services/ai/mock-ai-service.ts",
      recommendation: "为真实模型接入建立新 change。",
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
      title: "设置页仍依赖本地 mock settings",
      source: "src/pages/settings/SettingsPage.tsx",
      recommendation: "与个人信息页收缩一起评估是否拆出真实设置后端。",
    });
  }

  return backlog;
}

function getPreferredChange(tasks, activeChanges) {
  const tasksByChange = getTasksByChange(tasks);
  const candidates = activeChanges
    .map((changeName) => {
      const changeTasks = tasksByChange[changeName] ?? [];
      const todoTasks = changeTasks.filter((task) => task.status === "todo");
      if (todoTasks.length === 0) {
        return null;
      }

      return {
        changeName,
        todoTasks,
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
    ? [...preferredChange.todoTasks].sort(compareTasks)
    : [...tasks.filter((task) => task.status === "todo")].sort(compareTasks);
  const currentFocus = nextQueue[0] ?? null;
  const recentCompleted = tasks
    .filter((task) => completionStatus.has(task.status))
    .sort((a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      change: task.change,
      title: task.title,
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
      title: task.title,
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

