import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Mail, MessageCircleMore, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { mockAuthService } from "@/services/auth/mock-auth-service";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";

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
    <PageTransition className="min-h-screen px-4 py-8" style={{ background: "var(--gradient-warm-bg)" }}>
      {/* 装饰性渐变圆 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-[20%] -top-[10%] h-[50vh] w-[50vh] rounded-full bg-[#8B5CF6]/10 blur-[100px] dark:bg-[#A78BFA]/5" />
        <div className="absolute -bottom-[15%] -left-[15%] h-[60vh] w-[60vh] rounded-full bg-[#EC4899]/8 blur-[100px] dark:bg-[#F472B6]/4" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between rounded-[28px] border border-border bg-card/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
        <div>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING_BOUNCY}
            className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            AI Web Builder
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            当前为演示模式。邮箱登录、微信登录、Supabase 会话和回调链路都已预留入口，后续可直接替换为真实实现。
          </p>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-border bg-secondary/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              邮箱登录入口
            </div>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="demo@example.com"
              className="h-11 rounded-2xl"
            />
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={handleEmailLogin}
              disabled={isEmailLoading}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              进入邮箱演示模式
            </motion.button>
          </section>

          <section className="rounded-3xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <MessageCircleMore className="h-4 w-4" />
              微信登录入口
            </div>
            <p className="text-sm leading-6 text-emerald-800/80 dark:text-emerald-300/70">
              已预留微信登录按钮、状态处理和未来桥接服务接入位。本阶段仅模拟成功登录。
            </p>
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={handleWechatLogin}
              disabled={isWechatLoading}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#07C160] text-sm font-medium text-white transition-colors hover:bg-[#05a953] disabled:cursor-wait disabled:opacity-70"
            >
              {isWechatLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircleMore className="h-4 w-4" />
              )}
              进入微信演示模式
            </motion.button>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
