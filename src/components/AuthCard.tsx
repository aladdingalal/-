import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Server,
  HelpCircle,
} from 'lucide-react';
import { SocialAuthButtons } from './SocialAuthButtons';
import type { AuthMode, CloudConnectionStatus } from '../types';

interface AuthCardProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmitEmailPass: (name: string, email: string, pass: string, isRegister: boolean) => Promise<void>;
  onSocialLogin: (provider: string, providerNameAr: string) => void;
  loading: boolean;
  loadingProvider: string | null;
  statusMsg: { type: 'success' | 'error' | 'info'; text: string; hint?: string } | null;
  cloudStatus: CloudConnectionStatus;
  onOpenSettings: () => void;
  onQuickDemoLogin: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  mode,
  onModeChange,
  onSubmitEmailPass,
  onSocialLogin,
  loading,
  loadingProvider,
  statusMsg,
  cloudStatus,
  onOpenSettings,
  onQuickDemoLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitEmailPass(name, email, password, isRegister);
  };

  const handleFillDemo = () => {
    setEmail('farist.player@example.com');
    setPassword('FaristPass2026!');
    if (isRegister) {
      setName('فارس الألعاب');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glow effect behind card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 via-indigo-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-70 pointer-events-none" />

        <div className="relative bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Title & Mode Toggle */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>منصة Games farist السحابية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Tajawal'] tracking-tight">
              {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {isRegister
                ? 'انضم لتجربة الألعاب ومزامنة تقدمك سحابياً'
                : 'أهلاً بعودتك! سجل الدخول للوصول لحسابك السحابي'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                isRegister
                  ? 'bg-[#fd366e] text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          {/* Social Auth Providers Section */}
          <div className="mb-6">
            <p className="text-xs text-slate-400 font-medium mb-2.5 text-center">
              تسجيل الدخول السريع عبر الحسابات الاجتماعية:
            </p>
            <SocialAuthButtons
              onSocialLogin={onSocialLogin}
              loadingProvider={loadingProvider}
              disabled={loading}
            />
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-slate-900 text-slate-400 text-xs font-medium">
              أو بواسطة البريد الإلكتروني
            </span>
          </div>

          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: فارس أحمد"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors text-right"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  كلمة المرور
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      alert('يمكنك إعادة تعيين كلمة المرور عبر رابط Appwrite للاستعادة أو مراجعة بريدك.');
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500 w-4 h-4"
                />
                <span>تذكر بياناتي في هذا المتصفح</span>
              </label>

              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                تعبئة بيانات تجريبية
              </button>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || !!loadingProvider}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRegister
                  ? 'bg-[#fd366e] hover:bg-[#e62b60] text-white shadow-rose-600/30 ring-1 ring-rose-400/40'
                  : 'bg-slate-100 hover:bg-white text-slate-950 shadow-slate-200/10'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRegister ? 'جاري إنشاء الحساب...' : 'جاري تسجيل الدخول...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Feedback & Status Message */}
          {statusMsg && (
            <div
              className={`mt-5 p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {statusMsg.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {statusMsg.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                {statusMsg.type === 'info' && (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{statusMsg.text}</p>
                  {statusMsg.hint && (
                    <p className="text-slate-400 text-[11px]">{statusMsg.hint}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cloud Info & Fast Preview Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>السحابة: Appwrite Cloud</span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-rose-400 hover:underline text-[11px]"
              >
                (فحص النطاق وCORS)
              </button>
            </div>

            <button
              type="button"
              onClick={onQuickDemoLogin}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 hover:underline"
              title="معاينة لوحة تحكم اللاعب دون الحاجة للاتصال"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>معاينة واجهة اللاعب التجريبية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
