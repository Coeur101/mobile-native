import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mockProjectService } from "@/services/project/mock-project-service";
import type { Project } from "@/types";

export function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  async function loadProjects() {
    setProjects(await mockProjectService.listProjects());
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleDelete = async (projectId: string) => {
    await mockProjectService.deleteProject(projectId);
    toast.success("项目已删除。");
    await loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">MVP Dashboard</p>
            <h1 className="text-xl font-semibold text-slate-900">项目列表</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {projects.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">还没有项目</h2>
            <p className="mt-2 text-sm text-slate-500">
              当前为本地演示模式。你可以创建一个结构化网页项目，后续再切换到真实 AI 和云端数据。
            </p>
            <button
              type="button"
              onClick={() => navigate("/editor")}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              新建项目
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {project.status}
                    </span>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900">{project.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{project.description}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{project.messages.length}</div>
                    对话
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{project.versions.length}</div>
                    版本
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                    </div>
                    更新
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    继续编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/preview/${project.id}`)}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <Eye className="h-4 w-4" />
                    预览
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(project.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-100 px-4 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => navigate("/editor")}
        className="fixed bottom-6 right-6 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
      >
        <Plus className="h-5 w-5" />
        新建项目
      </button>
    </div>
  );
}
