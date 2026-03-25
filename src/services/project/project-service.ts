import type { Project, ProjectFileMap, ProjectMessage } from "@/types";

export interface ProjectService {
  listProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(prompt: string): Promise<Project>;
  continueProject(projectId: string, prompt: string): Promise<Project | null>;
  updateProjectFiles(projectId: string, files: ProjectFileMap): Promise<Project | null>;
  createProjectVersion(projectId: string, summary: string): Promise<Project | null>;
  restoreProjectVersion(projectId: string, versionId: string): Promise<Project | null>;
  updateProjectMeta(projectId: string, meta: { name?: string; description?: string }): Promise<Project | null>;
  appendProjectMessage(projectId: string, message: ProjectMessage): Promise<Project | null>;
  deleteProject(projectId: string): Promise<void>;
}
