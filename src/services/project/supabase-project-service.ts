import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { localDb } from "@/lib/local-db";
import { aiService as defaultAIService } from "@/services/ai";
import type { AIService } from "@/services/ai/ai-service";
import type {
  Project,
  ProjectFileMap,
  ProjectGenerationProgress,
  ProjectMessage,
  ProjectMeta,
  ProjectStatus,
  ProjectVersion,
} from "@/types";
import type { ProjectGenerationOptions, ProjectService } from "./project-service";

type ProjectRow = {
  id: string;
  owner_user_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  files: ProjectFileMap;
  preview: ProjectMeta;
  created_at: string;
  updated_at: string;
};

type ProjectVersionRow = {
  id: string;
  version_no: number;
  summary: string;
  files: ProjectFileMap;
  created_at: string;
  project_id: string;
  owner_user_id: string;
};

type ProjectMessageRow = {
  id: string;
  role: ProjectMessage["role"];
  content: string;
  created_at: string;
  project_id: string;
  owner_user_id: string;
  thinking_steps?: ProjectMessage["thinkingSteps"] | null;
  metadata?: ProjectMessage["metadata"] | null;
};

type ProjectServiceDependencies = {
  client?: SupabaseClient | null;
  aiService?: AIService;
};

type ProjectIdRow = {
  id: string;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextVersionId(projectId: string, versionNo: number) {
  return `${projectId}-v${versionNo}`;
}

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    files: row.files,
    messages: [],
    versions: [],
    preview: row.preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersionRow(row: ProjectVersionRow): ProjectVersion {
  return {
    id: row.id,
    versionNo: row.version_no,
    summary: row.summary,
    files: row.files,
    createdAt: row.created_at,
    projectId: row.project_id,
    ownerUserId: row.owner_user_id,
  };
}

function mapMessageRow(row: ProjectMessageRow): ProjectMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    projectId: row.project_id,
    ownerUserId: row.owner_user_id,
    thinkingSteps: row.thinking_steps ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

function requireCurrentUserId() {
  const userId = localDb.getUser()?.id;
  if (!userId) {
    throw new Error("需要先登录后才能访问项目数据。");
  }

  return userId;
}

function requireClient(override?: SupabaseClient | null) {
  const client = override ?? getSupabaseBrowserClient();
  if (!client) {
    throw new Error("尚未配置 Supabase 项目持久化能力。");
  }

  return client;
}

async function fetchVersions(
  client: SupabaseClient,
  projectIds: string[],
): Promise<ProjectVersionRow[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("project_versions")
    .select("*")
    .in("project_id", projectIds)
    .order("version_no", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProjectVersionRow[];
}

async function fetchMessages(
  client: SupabaseClient,
  projectIds: string[],
): Promise<ProjectMessageRow[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("project_messages")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProjectMessageRow[];
}

async function hydrateProjects(
  client: SupabaseClient,
  projectRows: ProjectRow[],
): Promise<Project[]> {
  const projects = projectRows.map(mapProjectRow);
  const projectIds = projects.map((project) => project.id);
  const [versionRows, messageRows] = await Promise.all([
    fetchVersions(client, projectIds),
    fetchMessages(client, projectIds),
  ]);

  const versionsByProjectId = new Map<string, ProjectVersion[]>();
  for (const row of versionRows) {
    const current = versionsByProjectId.get(row.project_id) ?? [];
    current.push(mapVersionRow(row));
    versionsByProjectId.set(row.project_id, current);
  }

  const messagesByProjectId = new Map<string, ProjectMessage[]>();
  for (const row of messageRows) {
    const current = messagesByProjectId.get(row.project_id) ?? [];
    current.push(mapMessageRow(row));
    messagesByProjectId.set(row.project_id, current);
  }

  return projects.map((project) => ({
    ...project,
    versions: versionsByProjectId.get(project.id) ?? [],
    messages: messagesByProjectId.get(project.id) ?? [],
  }));
}

async function listRemoteProjects(client: SupabaseClient, ownerUserId: string) {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateProjects(client, (data ?? []) as ProjectRow[]);
}

async function migrateLocalProjectsIfNeeded(client: SupabaseClient, ownerUserId: string) {
  if (localDb.hasProjectMigrationCompleted(ownerUserId)) {
    return;
  }

  const localProjects = localDb.getProjects();
  if (localProjects.length === 0) {
    localDb.markProjectMigrationCompleted(ownerUserId, []);
    return;
  }

  const { data, error } = await client
    .from("projects")
    .select("id")
    .eq("owner_user_id", ownerUserId);

  if (error) {
    throw new Error(error.message);
  }

  const existingIds = new Set(((data ?? []) as ProjectIdRow[]).map((row) => row.id));
  const pendingProjects = localProjects.filter((project) => !existingIds.has(project.id));

  if (pendingProjects.length === 0) {
    localDb.markProjectMigrationCompleted(
      ownerUserId,
      localProjects.map((project) => project.id),
    );
    return;
  }

  const { error: projectError } = await client.from("projects").insert(
    pendingProjects.map((project) => ({
      id: project.id,
      owner_user_id: ownerUserId,
      name: project.name,
      description: project.description,
      status: project.status,
      files: project.files,
      preview: project.preview,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    })),
  );

  if (projectError) {
    throw new Error(projectError.message);
  }

  const versionRows = pendingProjects.flatMap((project) =>
    project.versions.map((version) => ({
      id: version.id,
      version_no: version.versionNo,
      summary: version.summary,
      files: version.files,
      created_at: version.createdAt,
      project_id: project.id,
      owner_user_id: ownerUserId,
    })),
  );
  if (versionRows.length > 0) {
    const { error: versionError } = await client.from("project_versions").insert(versionRows);
    if (versionError) {
      throw new Error(versionError.message);
    }
  }

  const messageRows = pendingProjects.flatMap((project) =>
    project.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      created_at: message.createdAt,
      project_id: project.id,
      owner_user_id: ownerUserId,
      thinking_steps: message.thinkingSteps ?? null,
      metadata: message.metadata ?? null,
    })),
  );
  if (messageRows.length > 0) {
    const { error: messageError } = await client.from("project_messages").insert(messageRows);
    if (messageError) {
      throw new Error(messageError.message);
    }
  }

  localDb.markProjectMigrationCompleted(
    ownerUserId,
    localProjects.map((project) => project.id),
  );
}

async function loadRemoteProjectById(
  client: SupabaseClient,
  ownerUserId: string,
  id: string,
): Promise<Project | null> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [project] = await hydrateProjects(client, [data as ProjectRow]);
  return project ?? null;
}

function cacheProjects(projects: Project[]) {
  localDb.saveProjects(projects);
}

async function touchProject(client: SupabaseClient, projectId: string) {
  const { error } = await client
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }
}

function getAssistantGenerationProgress(payload: { messages: Array<Partial<ProjectMessage>> }): ProjectGenerationProgress {
  const assistantMessage = payload.messages.find((message) => message.role === "assistant");

  return {
    status: "streaming",
    content: assistantMessage?.content ?? "",
    thinkingSteps: assistantMessage?.thinkingSteps ?? [],
  };
}

export function createSupabaseProjectService(
  dependencies: ProjectServiceDependencies = {},
): ProjectService {
  const aiService = dependencies.aiService ?? defaultAIService;

  return {
    async listProjects() {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      await migrateLocalProjectsIfNeeded(client, ownerUserId);
      const projects = await listRemoteProjects(client, ownerUserId);
      cacheProjects(projects);
      return projects;
    },

    async getProjectById(id) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      await migrateLocalProjectsIfNeeded(client, ownerUserId);
      const project = await loadRemoteProjectById(client, ownerUserId, id);
      if (!project) {
        return null;
      }

      const cached = localDb.getProjects().filter((item) => item.id !== id);
      cacheProjects([project, ...cached]);
      return project;
    },

    async createProject(prompt, options) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      try {
        const payload = await aiService.generateProjectFromPrompt(prompt, undefined, {
          onProgress: options?.onProgress,
        });
        const now = new Date().toISOString();
        const projectId = createId("project");
        const project: Project = {
          id: projectId,
          ownerUserId,
          name: payload.projectName,
          description: payload.summary,
          status: "active",
          files: payload.files,
          messages: [
            {
              id: createId("message"),
              role: "user",
              content: prompt,
              createdAt: now,
              projectId,
              ownerUserId,
            },
            ...payload.messages.map((message) => ({
              ...message,
              id: message.id || createId("message"),
              projectId,
              ownerUserId,
            })),
          ],
          versions: [
            {
              id: nextVersionId(projectId, 1),
              versionNo: 1,
              summary: "首次根据需求生成的版本",
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

        options?.onProgress?.({
          ...getAssistantGenerationProgress(payload),
          status: "persisting",
        });

        const { error: projectError } = await client.from("projects").insert({
          id: project.id,
          owner_user_id: project.ownerUserId,
          name: project.name,
          description: project.description,
          status: project.status,
          files: project.files,
          preview: project.preview,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        });

        if (projectError) {
          throw new Error(projectError.message);
        }

        const { error: versionsError } = await client.from("project_versions").insert(
          project.versions.map((version) => ({
            id: version.id,
            version_no: version.versionNo,
            summary: version.summary,
            files: version.files,
            created_at: version.createdAt,
            project_id: version.projectId,
            owner_user_id: version.ownerUserId,
          })),
        );

        if (versionsError) {
          throw new Error(versionsError.message);
        }

        const { error: messagesError } = await client.from("project_messages").insert(
          project.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            created_at: message.createdAt,
            project_id: message.projectId,
            owner_user_id: message.ownerUserId,
            thinking_steps: message.thinkingSteps ?? null,
            metadata: message.metadata ?? null,
          })),
        );

        if (messagesError) {
          throw new Error(messagesError.message);
        }

        const projects = await listRemoteProjects(client, ownerUserId);
        cacheProjects(projects);
        const created = projects.find((item) => item.id === projectId) ?? project;
        options?.onProgress?.({
          ...getAssistantGenerationProgress(payload),
          status: "completed",
        });
        return created;
      } catch (error) {
        if (error instanceof Error) {
          options?.onProgress?.({
            status: "failed",
            content: "",
            thinkingSteps: [],
            error: error.message,
          });
          throw error;
        }

        options?.onProgress?.({
          status: "failed",
          content: "",
          thinkingSteps: [],
          error: "项目生成失败。",
        });
        throw new Error("项目生成失败。");
      }
    },

    async continueProject(projectId, prompt, options) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      const project = await loadRemoteProjectById(client, ownerUserId, projectId);
      if (!project) {
        return null;
      }

      try {
        const payload = await aiService.generateProjectFromPrompt(prompt, project, {
          onProgress: options?.onProgress,
        });
        const now = new Date().toISOString();
        const nextVersionNo = project.versions.length + 1;
        const nextMessages: ProjectMessage[] = [
          {
            id: createId("message"),
            role: "user",
            content: prompt,
            createdAt: now,
            projectId,
            ownerUserId,
          },
          ...payload.messages.map((message) => ({
            ...message,
            id: message.id || createId("message"),
            projectId,
            ownerUserId,
          })),
        ];

        options?.onProgress?.({
          ...getAssistantGenerationProgress(payload),
          status: "persisting",
        });

        const { error: projectError } = await client
          .from("projects")
          .update({
            files: payload.files,
            description: payload.summary,
            updated_at: now,
          })
          .eq("id", projectId)
          .eq("owner_user_id", ownerUserId);

        if (projectError) {
          throw new Error(projectError.message);
        }

        const { error: versionError } = await client.from("project_versions").insert({
          id: nextVersionId(project.id, nextVersionNo),
          version_no: nextVersionNo,
          summary: `根据新需求更新：${prompt.slice(0, 48)}`,
          files: payload.files,
          created_at: now,
          project_id: project.id,
          owner_user_id: ownerUserId,
        });

        if (versionError) {
          throw new Error(versionError.message);
        }

        const { error: messagesError } = await client.from("project_messages").insert(
          nextMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            created_at: message.createdAt,
            project_id: message.projectId,
            owner_user_id: message.ownerUserId,
            thinking_steps: message.thinkingSteps ?? null,
            metadata: message.metadata ?? null,
          })),
        );

        if (messagesError) {
          throw new Error(messagesError.message);
        }

        const updated = await loadRemoteProjectById(client, ownerUserId, projectId);
        if (!updated) {
          return null;
        }

        const cached = localDb.getProjects().filter((item) => item.id !== projectId);
        cacheProjects([updated, ...cached]);
        options?.onProgress?.({
          ...getAssistantGenerationProgress(payload),
          status: "completed",
        });
        return updated;
      } catch (error) {
        if (error instanceof Error) {
          options?.onProgress?.({
            status: "failed",
            content: "",
            thinkingSteps: [],
            error: error.message,
          });
          throw error;
        }

        options?.onProgress?.({
          status: "failed",
          content: "",
          thinkingSteps: [],
          error: "项目续写失败。",
        });
        throw new Error("项目续写失败。");
      }
    },

    async updateProjectFiles(projectId, files) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      const { error } = await client
        .from("projects")
        .update({
          files,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("owner_user_id", ownerUserId);

      if (error) {
        throw new Error(error.message);
      }

      const updated = await loadRemoteProjectById(client, ownerUserId, projectId);
      if (!updated) {
        return null;
      }

      const cached = localDb.getProjects().filter((item) => item.id !== projectId);
      cacheProjects([updated, ...cached]);
      return updated;
    },

    async createProjectVersion(projectId, summary) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      const project = await loadRemoteProjectById(client, ownerUserId, projectId);
      if (!project) {
        return null;
      }

      const versionNo = project.versions.length + 1;
      const createdAt = new Date().toISOString();
      const { error } = await client.from("project_versions").insert({
        id: nextVersionId(projectId, versionNo),
        version_no: versionNo,
        summary,
        files: project.files,
        created_at: createdAt,
        project_id: projectId,
        owner_user_id: ownerUserId,
      });

      if (error) {
        throw new Error(error.message);
      }

      await touchProject(client, projectId);
      return loadRemoteProjectById(client, ownerUserId, projectId);
    },

    async restoreProjectVersion(projectId, versionId) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      const project = await loadRemoteProjectById(client, ownerUserId, projectId);
      if (!project) {
        return null;
      }

      const version = project.versions.find((item) => item.id === versionId);
      if (!version) {
        return null;
      }

      const now = new Date().toISOString();
      const nextVersionNo = project.versions.length + 1;
      const { error: updateError } = await client
        .from("projects")
        .update({
          files: version.files,
          updated_at: now,
        })
        .eq("id", projectId)
        .eq("owner_user_id", ownerUserId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const { error: versionError } = await client.from("project_versions").insert({
        id: nextVersionId(project.id, nextVersionNo),
        version_no: nextVersionNo,
        summary: `恢复到版本 ${version.versionNo}`,
        files: version.files,
        created_at: now,
        project_id: project.id,
        owner_user_id: ownerUserId,
      });

      if (versionError) {
        throw new Error(versionError.message);
      }

      return loadRemoteProjectById(client, ownerUserId, projectId);
    },

    async updateProjectMeta(projectId, meta) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      const patch: Partial<ProjectRow> = {
        updated_at: new Date().toISOString(),
      };

      if (meta.name !== undefined) patch.name = meta.name;
      if (meta.description !== undefined) patch.description = meta.description;

      const { error } = await client
        .from("projects")
        .update(patch)
        .eq("id", projectId)
        .eq("owner_user_id", ownerUserId);

      if (error) {
        throw new Error(error.message);
      }

      return loadRemoteProjectById(client, ownerUserId, projectId);
    },

    async appendProjectMessage(projectId, message) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);
      const { error } = await client.from("project_messages").insert({
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.createdAt,
        project_id: projectId,
        owner_user_id: ownerUserId,
        thinking_steps: message.thinkingSteps ?? null,
        metadata: message.metadata ?? null,
      });

      if (error) {
        throw new Error(error.message);
      }

      await touchProject(client, projectId);
      return loadRemoteProjectById(client, ownerUserId, projectId);
    },

    async deleteProject(projectId) {
      const ownerUserId = requireCurrentUserId();
      const client = requireClient(dependencies.client);

      const { error: messagesError } = await client
        .from("project_messages")
        .delete()
        .eq("project_id", projectId)
        .eq("owner_user_id", ownerUserId);

      if (messagesError) {
        throw new Error(messagesError.message);
      }

      const { error: versionsError } = await client
        .from("project_versions")
        .delete()
        .eq("project_id", projectId)
        .eq("owner_user_id", ownerUserId);

      if (versionsError) {
        throw new Error(versionsError.message);
      }

      const { error: projectError } = await client
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("owner_user_id", ownerUserId);

      if (projectError) {
        throw new Error(projectError.message);
      }

      cacheProjects(localDb.getProjects().filter((item) => item.id !== projectId));
    },
  };
}
