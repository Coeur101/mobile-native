import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { motion } from "motion/react";

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to home
    if (localStorage.getItem("fake_user_logged_in") === "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleWechatLogin = () => {
    if (!agreed) {
      setShowError(true);
      // Shake animation effect could be added here, but simple visual feedback is enough
      setTimeout(() => setShowError(false), 2000);
      return;
    }

    setIsLoading(true);
    
    // Mock login process
    setTimeout(() => {
      localStorage.setItem("fake_user_logged_in", "true");
      navigate("/", { replace: true });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-200/30 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-slate-100/40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full z-10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-slate-100/50 flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center w-full"
        >
          {/* Logo */}
          <div className="w-20 h-20 mb-6 rounded-3xl bg-slate-800 shadow-lg shadow-slate-200 flex items-center justify-center relative">
            <Sparkles className="w-10 h-10 text-white" />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
            欢迎使用 AI Web Builder
          </h1>
          <p className="text-slate-500 text-sm mb-12 text-center">
            一句话生成网页，探索无界灵感
          </p>

          {/* Login Actions */}
          <div className="w-full flex flex-col gap-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleWechatLogin}
              disabled={isLoading}
              className={`relative w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-medium text-lg overflow-hidden transition-all ${
                isLoading ? "bg-[#07C160]/80 cursor-wait" : "bg-[#07C160] hover:shadow-lg hover:shadow-[#07C160]/20"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登录中...</span>
                </div>
              ) : (
                <>
                  {/* Custom WeChat Icon */}
                  <svg viewBox="0 0 1024 1024" fill="currentColor" className="w-6 h-6">
                    <path d="M682.666667 384c17.066667 0 34.133333 2.133333 51.2 4.266667C693.333333 241.066667 544 128 362.666667 128 170.666667 128 10.666667 256 10.666667 416c0 91.733333 51.2 177.066667 138.666666 234.666667-10.666667 32-32 85.333333-32 85.333333s57.6-14.933333 108.8-44.8c30.933333 8.533333 66.133333 14.933333 100.266667 14.933333 12.8 0 25.6-2.133333 38.4-2.133333-27.733333-38.4-42.666667-83.2-42.666667-130.133333 0-104.533333 100.266667-189.866667 221.866667-189.866667h138.666666z m-465.066667-34.133333c-23.466667 0-42.666667-19.2-42.666667-42.666667s19.2-42.666667 42.666667-42.666667 42.666667 19.2 42.666667 42.666667-19.2 42.666667-42.666667 42.666667z m277.333333 0c-23.466667 0-42.666667-19.2-42.666667-42.666667s19.2-42.666667 42.666667-42.666667 42.666667 19.2 42.666667 42.666667-19.2 42.666667-42.666667 42.666667z" />
                    <path d="M994.133333 618.666667c0-128-121.6-234.666667-270.933333-234.666667-147.2 0-268.8 104.533333-268.8 234.666667s121.6 234.666667 268.8 234.666667c29.866667 0 57.6-6.4 83.2-14.933333 36.266667 23.466667 78.933333 36.266667 78.933333 36.266667s-14.933333-38.4-23.466667-61.866667c61.866667-44.8 102.4-113.066667 102.4-194.133333z m-352-42.666667c-17.066667 0-32-14.933333-32-32s14.933333-32 32-32 32 14.933333 32 32-14.933333 32-32 32z m192 0c-17.066667 0-32-14.933333-32-32s14.933333-32 32-32 32 14.933333 32 32-14.933333 32-32 32z" />
                  </svg>
                  微信一键登录
                </>
              )}
            </motion.button>
            
            <button className="h-14 rounded-2xl flex items-center justify-center text-slate-500 font-medium hover:bg-slate-100/50 transition-colors">
              手机号登录
            </button>
          </div>

        </motion.div>
      </main>

      {/* Footer / Terms */}
      <footer className="w-full pb-8 pt-4 px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center"
        >
          <div className="flex items-start gap-2 max-w-[280px]">
            <button 
              onClick={() => {
                setAgreed(!agreed);
                if (showError) setShowError(false);
              }}
              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                agreed 
                  ? "bg-slate-800 border-slate-800" 
                  : showError
                    ? "border-red-400 bg-red-50/50"
                    : "border-slate-300 bg-white"
              }`}
            >
              <Check className={`w-3 h-3 text-white transition-opacity ${agreed ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
            </button>
            <p className={`text-xs leading-relaxed transition-colors ${showError ? "text-red-500" : "text-slate-400"}`}>
              我已阅读并同意 <a href="#" className="text-slate-800 font-medium hover:underline">用户协议</a> 和 <a href="#" className="text-slate-800 font-medium hover:underline">隐私政策</a>，未注册绑定的手机号验证后将自动创建账号。
            </p>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
