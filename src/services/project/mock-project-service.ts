import { localDb } from "@/lib/local-db";
import { mockAIService } from "@/services/ai/mock-ai-service";
import type { ProjectService } from "./project-service";
import type { Project, ProjectFileMap, ProjectMessage } from "@/types";

function nextProjectId() {
  return `project-${Date.now()}`;
}

function nextVersionId(projectId: string, versionNo: number) {
  return `${projectId}-v${versionNo}`;
}

function persist(projects: Project[]) {
  localDb.saveProjects(projects);
}

function requireCurrentUserId(): string {
  const userId = localDb.getUser()?.id;
  if (!userId) {
    throw new Error("当前未登录，无法操作项目数据。");
  }

  return userId;
}

export const mockProjectService: ProjectService = {
  async listProjects() {
    return localDb.getProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async getProjectById(id) {
    return localDb.getProjects().find((project) => project.id === id) ?? null;
  },
  async createProject(prompt) {
    const ownerUserId = requireCurrentUserId();
    const payload = await mockAIService.generateProjectFromPrompt(prompt);
    const now = new Date().toISOString();
    const projectId = nextProjectId();
    const project: Project = {
      id: projectId,
      ownerUserId,
      name: payload.projectName,
      description: payload.summary,
      status: "active",
      files: payload.files,
      messages: [
        {
          id: `${Date.now()}-user`,
          role: "user",
          content: prompt,
          createdAt: now,
          projectId,
          ownerUserId,
        },
        ...payload.messages.map((message) => ({
          ...message,
          projectId,
          ownerUserId,
        })),
      ],
      versions: [
        {
          id: nextVersionId(projectId, 1),
          versionNo: 1,
          summary: "首次根据提示词生成项目文件",
          files: payload.files,
          createdAt: now,
          projectId,
          ownerUserId,
        },
      ],
      preview: payload.meta,
      createdAt: now,
      updatedAt: now,
    };

    const projects = localDb.getProjects();
    projects.unshift(project);
    persist(projects);
    return project;
  },
  async continueProject(projectId, prompt) {
    const projects = localDb.getProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return null;
    }

    const now = new Date().toISOString();
    const payload = await mockAIService.generateProjectFromPrompt(prompt, project);
    const nextVersionNo = project.versions.length + 1;

    project.messages = [
      ...project.messages,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content: prompt,
        createdAt: now,
        projectId: project.id,
        ownerUserId: project.ownerUserId,
      },
      ...payload.messages.map((message) => ({
        ...message,
        projectId: project.id,
        ownerUserId: project.ownerUserId,
      })),
    ];
    project.files = payload.files;
    project.description = payload.summary;
    project.updatedAt = now;
    project.versions = [
      {
        id: nextVersionId(project.id, nextVersionNo),
        versionNo: nextVersionNo,
        summary: `根据新提示词更新项目：${prompt.slice(0, 20)}`,
        files: payload.files,
        createdAt: now,
        projectId: project.id,
        ownerUserId: project.ownerUserId,
      },
      ...project.versions,
    ];

    persist(projects);
    return project;
  },
  async updateProjectFiles(projectId, files) {
    const projects = localDb.getProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return null;
    }
    project.files = files;
    project.updatedAt = new Date().toISOString();
    persist(projects);
    return project;
  },
  async createProjectVersion(projectId, summary) {
    const projects = localDb.getProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return null;
    }

    const versionNo = project.versions.length + 1;
    project.versions = [
      {
        id: nextVersionId(projectId, versionNo),
        versionNo,
        summary,
        files: project.files,
        createdAt: new Date().toISOString(),
        projectId,
        ownerUserId: project.ownerUserId,
      },
      ...project.versions,
    ];
    project.updatedAt = new Date().toISOString();
    persist(projects);
    return project;
  },
  async appendProjectMessage(projectId, message) {
    const projects = localDb.getProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return null;
    }

    project.messages = [
      ...project.messages,
      {
        ...message,
        projectId,
        ownerUserId: project.ownerUserId,
      },
    ];
    project.updatedAt = new Date().toISOString();
    persist(projects);
    return project;
  },
  async deleteProject(projectId) {
    persist(localDb.getProjects().filter((project) => project.id !== projectId));
  },
  async restoreProjectVersion(projectId, versionId) {
    const projects = localDb.getProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) return null;

    const version = project.versions.find((v) => v.id === versionId);
    if (!version) return null;

    // 恢复文件内容为该版本的快照
    project.files = { ...version.files };
    project.updatedAt = new Date().toISOString();

    // 创建一个新的版本快照记录此次恢复操作
    const nextVersionNo = project.versions.length + 1;
    project.versions = [
      {
        id: nextVersionId(project.id, nextVersionNo),
        versionNo: nextVersionNo,
        summary: `恢复到版本 ${version.versionNo}`,
        files: { ...version.files },
        createdAt: new Date().toISOString(),
        projectId: project.id,
        ownerUserId: project.ownerUserId,
      },
      ...project.versions,
    ];

    persist(projects);
    return project;
  },
  async updateProjectMeta(projectId, meta) {
    const projects = localDb.getProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) return null;

    if (meta.name !== undefined) project.name = meta.name;
    if (meta.description !== undefined) project.description = meta.description;
    project.updatedAt = new Date().toISOString();

    persist(projects);
    return project;
  },
};
