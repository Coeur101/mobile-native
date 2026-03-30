import type { Project, ProjectFileMap, ProjectGenerationProgress, ProjectMessage } from "@/types";

export interface ProjectGenerationOptions {
  onProgress?: (progress: ProjectGenerationProgress) => void;
}

export interface ProjectService {
  listProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(prompt: string, options?: ProjectGenerationOptions): Promise<Project>;
  continueProject(projectId: string, prompt: string, options?: ProjectGenerationOptions): Promise<Project | null>;
  updateProjectFiles(projectId: string, files: ProjectFileMap): Promise<Project | null>;
  createProjectVersion(projectId: string, summary: string): Promise<Project | null>;
  restoreProjectVersion(projectId: string, versionId: string): Promise<Project | null>;
  updateProjectMeta(projectId: string, meta: { name?: string; description?: string }): Promise<Project | null>;
  appendProjectMessage(projectId: string, message: ProjectMessage): Promise<Project | null>;
  deleteProject(projectId: string): Promise<void>;
}
