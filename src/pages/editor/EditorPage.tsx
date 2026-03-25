import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Eye, FileCode2, History, MessageSquarePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { promptTemplates } from "@/features/project/templates";
import { buildPreviewDocument } from "@/lib/render-project";
import { mockProjectService } from "@/services/project/mock-project-service";
import { useEditorStore } from "@/stores/use-editor-store";
import type { Project } from "@/types";

export function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { activeTab, selectedFile, setActiveTab, setSelectedFile } = useEditorStore();

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setProject(null);
        return;
      }
      const nextProject = await mockProjectService.getProjectById(projectId);
      setProject(nextProject);
    }

    void loadProject();
  }, [projectId]);

  const previewDocument = useMemo(() => buildPreviewDocument(project?.files ?? {}), [project]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入你想生成的页面需求。");
      return;
    }

    setIsGenerating(true);
    try {
      const nextProject = project
        ? await mockProjectService.continueProject(project.id, prompt)
        : await mockProjectService.createProject(prompt);

      if (!nextProject) {
        toast.error("项目不存在，无法继续生成。");
        return;
      }

      setProject(nextProject);
      setPrompt("");
      setSelectedFile("index.html");
      toast.success(project ? "项目已按新需求更新。" : "项目已创建。");
      if (!projectId) {
        navigate(`/editor/${nextProject.id}`, { replace: true });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!project) {
      toast.error("请先生成项目。");
      return;
    }
    setIsSaving(true);
    try {
      const nextProject = await mockProjectService.createProjectVersion(
        project.id,
        "手动保存当前编辑版本",
      );
      if (nextProject) {
        setProject(nextProject);
        toast.success("已保存新版本快照。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateSelectedFile = async (value: string) => {
    if (!project) {
      return;
    }
    const nextProject = await mockProjectService.updateProjectFiles(project.id, {
      ...project.files,
      [selectedFile]: value,
    });
    if (nextProject) {
      setProject(nextProject);
    }
  };

  const fileEntries = Object.entries(project?.files ?? {});

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Editor</p>
              <h1 className="text-lg font-semibold text-slate-900">
                {project ? project.name : "新建项目"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => project && navigate(`/preview/${project.id}`)}
              disabled={!project}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              独立预览
            </button>
            <button
              type="button"
              onClick={() => void handleSaveVersion()}
              disabled={!project || isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              保存版本
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MessageSquarePlus className="h-4 w-4" />
            需求输入
          </div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="描述你想创建或更新的网页。当前会生成结构化文件，并保留后续对接真实 AI 的入口。"
            className="mt-3 min-h-32 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {promptTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setPrompt(template.prompt)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="font-medium text-slate-900">{template.label}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {template.prompt}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isGenerating ? "生成中..." : project ? "继续生成" : "生成项目"}
          </button>

          <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
            当前为演示模式。邮箱登录、微信登录、Supabase 数据和真实 AI 调用都只预留了入口，页面结构与数据模型已按后续真实接入形态组织。
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid h-auto grid-cols-4 rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="chat" className="rounded-xl py-2">对话</TabsTrigger>
              <TabsTrigger value="files" className="rounded-xl py-2">文件</TabsTrigger>
              <TabsTrigger value="preview" className="rounded-xl py-2">预览</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl py-2">历史</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-5">
              <div className="space-y-3">
                {(project?.messages ?? []).length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    还没有对话记录，先输入一个需求生成项目。
                  </div>
                ) : (
                  project?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-3xl border px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] opacity-70">
                        {message.role}
                      </div>
                      {message.content}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-5">
              {!project ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  先生成项目后再编辑文件。
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <aside className="space-y-2">
                    {fileEntries.map(([fileName]) => (
                      <button
                        key={fileName}
                        type="button"
                        onClick={() => setSelectedFile(fileName)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm transition ${
                          selectedFile === fileName
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <FileCode2 className="h-4 w-4" />
                        {fileName}
                      </button>
                    ))}
                  </aside>
                  <textarea
                    value={project.files[selectedFile] ?? ""}
                    onChange={(event) => void updateSelectedFile(event.target.value)}
                    className="min-h-[420px] w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-slate-500"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-5">
              {!project ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  先生成项目后再预览。
                </div>
              ) : (
                <div className="overflow-hidden rounded-[28px] border border-slate-200">
                  <iframe
                    title="embedded-preview"
                    srcDoc={previewDocument}
                    className="h-[560px] w-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-5">
              {!project ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  还没有版本历史。
                </div>
              ) : (
                <div className="space-y-3">
                  {project.versions.map((version) => (
                    <article
                      key={version.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <History className="h-4 w-4" />
                        版本 #{version.versionNo}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{version.summary}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(version.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
