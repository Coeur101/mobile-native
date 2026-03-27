import { getHarnessFilePath, loadHarnessState, writeJson } from "./shared.mjs";

const state = loadHarnessState();

const orchestration = {
  generatedAt: state.generatedAt,
  currentFocus: state.currentFocus,
  whySelected: state.currentFocus
    ? "继续当前最活跃 change 中最高优先级、最靠前的待办任务"
    : "未发现待执行任务",
  mustRead: state.currentFocus?.mustRead ?? [],
  mustVerify: state.currentFocus?.requiredChecks ?? [],
  nextQueue: state.nextQueue,
  repoBacklog: state.repoBacklog,
};

writeJson(getHarnessFilePath("orchestration.json"), orchestration);
console.log(JSON.stringify(orchestration, null, 2));

