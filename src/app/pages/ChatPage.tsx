import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  User,
  Eye,
  Grid,
  Grid3X3,
  Timer,
  CloudSun,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { storage } from "../utils/storage";
import { Project, ChatMessage } from "../types";
import { toast } from "sonner";

export function ChatPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      const existingProject = storage.getProject(projectId);
      if (existingProject) {
        setProject(existingProject);
        setMessages(existingProject.chatHistory);
      }
    }
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `我已经理解了您的需求："${userMessage.content}"。正在为您生成网页代码...\n\n这是一个基于您需求的网页项目。我使用了现代化的设计风格，包含了响应式布局和流畅的动画效果。`,
        timestamp: new Date(),
      };

      const newMessages = [...messages, userMessage, assistantMessage];
      setMessages(newMessages);

      // Create or update project
      const code = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${userMessage.content}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    h1 {
      color: #1e293b;
      margin-bottom: 20px;
      font-size: 2rem;
    }
    p {
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ ${userMessage.content}</h1>
    <p>这是由 AI 生成的网页项目</p>
  </div>
</body>
</html>`;

      if (projectId && project) {
        // Update existing project
        storage.updateProject(projectId, {
          chatHistory: newMessages,
          code: code,
        });
        toast.success("项目已更新");
      } else {
        // Create new project
        const newProject: Project = {
          id: Date.now().toString(),
          title: userMessage.content.slice(0, 30),
          description: assistantMessage.content.slice(0, 100),
          createdAt: new Date(),
          updatedAt: new Date(),
          code: code,
          chatHistory: newMessages,
        };
        storage.addProject(newProject);
        setProject(newProject);
        toast.success("项目已创建");
      }

      setIsLoading(false);
    }, 2000);
  };

  const handlePreview = () => {
    if (project) {
      navigate(`/preview/${project.id}`);
    }
  };

  const templates = [
    { icon: Grid, label: "扫雷游戏", prompt: "生成一个扫雷游戏，包含初中高三个难度，需要有经典的计时器和剩余地雷数量显示，使用柔和的颜色和可爱的动效。" },
    { icon: Grid3X3, label: "数独游戏", prompt: "生成一个数独游戏，支持填数字和笔记模式，做一些友好的高亮提示，整体UI风格保持极简和干净。" },
    { icon: Timer, label: "番茄钟应用", prompt: "生成一个极简番茄钟应用，支持专注和休息模式切换，需要一个巨大的倒计时显示和进度环，带上优雅的过渡动画。" },
    { icon: CloudSun, label: "天气卡片", prompt: "生成一个毛玻璃风格的天气预报卡片，显示当前温度、天气图标、未来三天的预测，界面需要有质感和层次感。" },
  ];

  const handleTemplateClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </motion.button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">
                {project ? "编辑项目" : "新建项目"}
              </h1>
              {project && (
                <p className="text-xs text-slate-500">{project.title}</p>
              )}
            </div>
          </div>
          {project && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePreview}
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-md mx-auto w-full px-4 py-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 flex flex-col items-center justify-center h-full"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">
                你想创造点什么？
              </h2>
              <p className="text-sm text-slate-500 mb-8">
                输入需求或者尝试以下灵感模板
              </p>

              {/* Templates */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {templates.map((template, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleTemplateClick(template.prompt)}
                    className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col items-start gap-3 group text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-100 group-hover:scale-110 transition-transform">
                      <template.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800 mb-0.5">
                        {template.label}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {template.prompt}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-slate-800"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  {/* Message */}
                  <div
                    className={`flex-1 ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[85%] px-4 py-2.5 rounded-2xl ${
                        message.role === "user"
                          ? "bg-slate-800 text-white rounded-tr-sm shadow-sm"
                          : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <p
                      className={`text-[11px] text-slate-400 mt-1.5 px-2 ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        <span className="text-sm text-slate-500">
                          正在思考...
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-20 backdrop-blur-xl bg-white/70 border-t border-slate-100 pb-safe">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex gap-2 items-end relative">
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="描述你想要的网页或选择上方模板..."
                className="w-full px-4 py-3 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400 min-h-[48px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 hover:shadow-md transition-all flex-shrink-0 mb-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}