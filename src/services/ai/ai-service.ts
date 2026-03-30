import type { GeneratedProjectPayload, Project, ProjectGenerationProgress } from "@/types";

export interface ProjectGenerationOptions {
  onProgress?: (progress: ProjectGenerationProgress) => void;
}

export interface AIService {
  generateProjectFromPrompt(
    prompt: string,
    project?: Project,
    options?: ProjectGenerationOptions,
  ): Promise<GeneratedProjectPayload>;
}
