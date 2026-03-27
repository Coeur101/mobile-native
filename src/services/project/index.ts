import { createSupabaseProjectService } from "./supabase-project-service";

export { createSupabaseProjectService } from "./supabase-project-service";
export type { ProjectService } from "./project-service";

export const projectService = createSupabaseProjectService();
