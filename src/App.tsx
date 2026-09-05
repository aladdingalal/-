import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AuthCard } from './components/AuthCard';
import { CloudImageTestingPage } from './components/CloudImageTestingPage';
import { CloudConfigModal } from './components/CloudConfigModal';
import {
  testCloudConnection,
  getCurrentUser,
  loginWithEmail,
  registerNewUser,
  startOAuthLogin,
  logoutCurrentSession,
  translateAppwriteError,
} from './services/appwrite';
import type { AuthMode, UserProfile, CloudConnectionStatus } from './types';
import { Smartphone, Monitor, Tablet, ShieldCheck, Zap, Cloud } from 'lucide-react';

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    hint?: string;
  } | null>(null);

  const [cloudStatus, setCloudStatus] = useState<CloudConnectionStatus>({
    state: 'checking',
    message: 'جاري فحص حالة اتصال السحابة...',
  });

  // Ping cloud connection
  const checkCloudHealth = useCallback(async () => {
    setCloudStatus((prev) => ({ ...prev, state: 'checking' }));
    const result = await testCloudConnection();
    setCloudStatus(result);
  }, []);

  // Check active user session on load (including after OAuth return)
  const loadUserSession = useCallback(async () => {
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        setUser(existingUser);
        setIsDemoUser(false);
      }
    } catch (err) {
      console.log('No active session:', err);
    }
  }, []);

  useEffect(() => {
    checkCloudHealth();
    loadUserSession();
  }, [checkCloudHealth, loadUserSession]);

  // Handle Email & Password Submit
  const handleSubmitEmailPass = async (
    name: string,
    email: string,
    pass: string,
    isRegister: boolean
  ) => {
    if (!email || !pass) {
      setStatusMsg({
        type: 'error',
        text: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
      });
      return;
    }

    if (pass.length < 8) {
      setStatusMsg({
        type: 'error',
        text: 'كلمة المرور يجب ألا تقل عن 8 أحرف',
        hint: 'أدخل كلمة مرور تتكون من 8 أحرف أو أرقام على الأقل.',
      });
      return;
    }

    setLoading(true);
    setStatusMsg({
      type: 'info',
      text: isRegister ? 'جاري إنشاء الحساب في السحابة...' : 'جاري تسجيل الدخول إلى السحابة...',
    });

    try {
      if (isRegister) {
        // Step 1: Create Account
        await registerNewUser(name, email, pass);
        setStatusMsg({
          type: 'success',
          text: 'تم إنشاء الحساب بنجاح! جاري تسجيل الدخول التلقائي...',
        });
        // Step 2: Auto-login
        await loginWithEmail(email, pass);
      } else {
        // Sign in
        await loginWithEmail(email, pass);
      }

      // Fetch user data
      const accountData = await getCurrentUser();
      if (accountData) {
        setUser(accountData);
        setIsDemoUser(false);
        setStatusMsg({
          type: 'success',
          text: 'تم تسجيل الدخول بنجاح!',
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const translated = translateAppwriteError(error);
      setStatusMsg({
        type: 'error',
        text: translated.text,
        hint: translated.hint,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Social Login
  const handleSocialLogin = async (provider: string, providerNameAr: string) => {
    setLoadingProvider(provider);
    setStatusMsg({
      type: 'info',
      text: `جاري التوجيه لتسجيل الدخول بواسطة ${providerNameAr}...`,
    });

    try {
      startOAuthLogin(provider);
      // If browser redirects, user will be navigated
    } catch (error: any) {
      console.error('Social login error:', error);
      const translated = translateAppwriteError(error);
      setStatusMsg({
        type: 'error',
        text: `تعذر إتمام الدخول عبر ${providerNameAr}: ${translated.text}`,
        hint:
          translated.hint ||
          `تأكد من تفعيل مزود ${providerNameAr} في لوحة تحكم Appwrite لمشروعك.`,
      });
      setLoadingProvider(null);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (isDemoUser) {
      setUser(null);
      setIsDemoUser(false);
      setStatusMsg({ type: 'info', text: 'تم الخروج من وضع المعاينة التجريبية.' });
      return;
    }

    try {
      await logoutCurrentSession();
      setUser(null);
      setStatusMsg({
        type: 'success',
        text: 'تم تسجيل الخروج بنجاح من السحابة.',
      });
    } catch (err: any) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  // Quick Demo Login for UI Testing
  const handleQuickDemoLogin = () => {
    setIsDemoUser(true);
    setUser({
      $id: 'farist_demo_' + Math.floor(Math.random() * 90000 + 10000),
      name: 'فارس الألعاب (تجريبي)',
      email: 'farist.player@example.com',
      registration: new Date().toISOString(),
      status: true,
      emailVerification: true,
    });
    setStatusMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo'] relative selection:bg-rose-500 selection:text-white">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top Navbar */}
      <Navbar
        status={cloudStatus}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onTestPing={checkCloudHealth}
      />

      {/* Responsive Viewport Indicator Bar */}
      <div className="w-full bg-slate-900/40 border-b border-slate-800/60 py-1.5 px-4 text-center">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span>متوافق مع الهواتف الذكية</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Tablet className="w-3.5 h-3.5 text-indigo-400" />
            <span>الأجهزة اللوحية</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>الحواسيب والشاشات الكبيرة</span>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          {user ? (
            <CloudImageTestingPage
              user={user}
              cloudStatus={cloudStatus}
              onLogout={handleLogout}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onTestPing={checkCloudHealth}
              isDemo={isDemoUser}
            />
          ) : (
            <AuthCard
              mode={authMode}
              onModeChange={setAuthMode}
              onSubmitEmailPass={handleSubmitEmailPass}
              onSocialLogin={handleSocialLogin}
              loading={loading}
              loadingProvider={loadingProvider}
              statusMsg={statusMsg}
              cloudStatus={cloudStatus}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onQuickDemoLogin={handleQuickDemoLogin}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-900/50 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-['Tajawal']">Games farist</span>
            <span>• واجهة سحابية متوافقة مع كافة الشاشات</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-rose-400 hover:underline"
            >
              فحص السحابة وCORS
            </button>
            <span>•</span>
            <span className="text-slate-400 font-mono">Appwrite Cloud 14+</span>
          </div>
        </div>
      </footer>

      {/* Cloud Configuration Modal */}
      <CloudConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={checkCloudHealth}
      />
    </div>
  );
}
