import type { GeneratedProjectPayload, Project } from "@/types";

export interface AIService {
  generateProjectFromPrompt(prompt: string, project?: Project): Promise<GeneratedProjectPayload>;
}
