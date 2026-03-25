import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Code, Eye, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { storage } from "../utils/storage";
import { Project } from "../types";

export function PreviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (projectId) {
      const existingProject = storage.getProject(projectId);
      if (existingProject) {
        setProject(existingProject);
      } else {
        navigate("/");
      }
    }
  }, [projectId, navigate]);

  // Optionally auto-hide controls after a few seconds of inactivity, 
  // but for a simpler UX on mobile, let's keep them accessible or toggleable.
  // We will keep it visible but very visually lightweight.

  if (!project) {
    return null;
  }

  const handleExport = () => {
    const blob = new Blob([project.code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "project"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Main Content Area */}
      <div className="w-full h-full flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full bg-white"
            >
              <iframe
                srcDoc={project.code}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full bg-gray-900 overflow-auto p-4 md:p-8 pt-24 pb-32"
            >
              <pre className="text-xs md:text-sm text-gray-300 font-mono leading-relaxed max-w-4xl mx-auto whitespace-pre-wrap">
                <code>{project.code}</code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Controls Dock */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 p-1.5 rounded-full backdrop-blur-xl bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60">
          
          {/* Back Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-white/80 hover:text-gray-900 transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="w-px h-6 bg-gray-300/50" />
          
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/20">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                activeTab === "preview"
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
              title="预览"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                activeTab === "code"
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
              title="代码"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300/50" />
          
          {/* Export Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleExport}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-white/80 hover:text-gray-900 transition-colors"
            title="导出为 HTML"
          >
            <Download className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
