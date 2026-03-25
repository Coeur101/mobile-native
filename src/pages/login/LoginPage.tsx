import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Mail, MessageCircleMore, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { mockAuthService } from "@/services/auth/mock-auth-service";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@example.com");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isWechatLoading, setIsWechatLoading] = useState(false);

  useEffect(() => {
    if (mockAuthService.getCurrentUser()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleEmailLogin = async () => {
    setIsEmailLoading(true);
    try {
      await mockAuthService.signInWithEmail(email);
      toast.success("邮箱登录入口已预留，当前进入演示模式。");
      navigate("/", { replace: true });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    setIsWechatLoading(true);
    try {
      await mockAuthService.signInWithWechat();
      toast.success("微信登录入口已预留，当前为 mock 登录。");
      navigate("/", { replace: true });
    } finally {
      setIsWechatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div>
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            AI Web Builder
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            当前为演示模式。邮箱登录、微信登录、Supabase 会话和回调链路都已预留入口，后续可直接替换为真实实现。
          </p>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="h-4 w-4" />
              邮箱登录入口
            </div>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="demo@example.com"
              className="h-11 rounded-2xl border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={handleEmailLogin}
              disabled={isEmailLoading}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
            >
              {isEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              进入邮箱演示模式
            </button>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <MessageCircleMore className="h-4 w-4" />
              微信登录入口
            </div>
            <p className="text-sm leading-6 text-emerald-800/80">
              已预留微信登录按钮、状态处理和未来桥接服务接入位。本阶段仅模拟成功登录。
            </p>
            <button
              type="button"
              onClick={handleWechatLogin}
              disabled={isWechatLoading}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#07C160] text-sm font-medium text-white transition hover:bg-[#05a953] disabled:cursor-wait disabled:opacity-70"
            >
              {isWechatLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircleMore className="h-4 w-4" />
              )}
              进入微信演示模式
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
