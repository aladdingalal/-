import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Key,
  LogOut,
  Sparkles,
  Cloud,
  CheckCircle,
  Copy,
  RefreshCw,
  Gamepad2,
  Trophy,
  Activity,
} from 'lucide-react';
import type { UserProfile, CloudConnectionStatus } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  cloudStatus: CloudConnectionStatus;
  onLogout: () => void;
  onTestPing: () => void;
  isDemo?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  cloudStatus,
  onLogout,
  onTestPing,
  isDemo = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud_test'>('profile');

  const copyUserId = () => {
    navigator.clipboard.writeText(user.$id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = user.registration
    ? new Date(user.registration).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'اليوم';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-xl shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-300 font-extrabold text-2xl">
                {user.name ? user.name[0].toUpperCase() : 'G'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-['Tajawal']">
                  مرحباً بك، {user.name || 'لاعب Games farist'}!
                </h2>
                {isDemo && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    وضع المعاينة
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span>تم تسجيل الدخول بنجاح إلى منصة السحابة</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-medium">جلسة نشطة</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/50 text-xs font-bold transition-all self-stretch sm:self-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          بيانات الحساب والجلسة
        </button>
        <button
          onClick={() => setActiveTab('cloud_test')}
          className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'cloud_test'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>اختبار الاتصال بالسحابة</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identity Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-rose-400" />
              <span>معلومات الهوية السحابية</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block mb-1">الاسم الكامل</span>
                <span className="font-semibold text-white text-sm">
                  {user.name || 'غير محدد'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block mb-1">البريد الإلكتروني</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-200" dir="ltr">
                    {user.email}
                  </span>
                  {user.emailVerification ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" /> تم التحقق
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      قيد التحقق
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block mb-1">معرف المستخدم السحابي ($id)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-300 truncate text-[11px]" dir="ltr">
                    {user.$id}
                  </span>
                  <button
                    onClick={copyUserId}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700 transition-colors shrink-0"
                    title="نسخ المعرف"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Session & Gaming Stats Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-rose-400" />
              <span>حالة حساب الألعاب (Games farist)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">تاريخ الانضمام</span>
                  <span className="text-slate-200 font-medium">{formattedDate}</span>
                </div>
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">مستوى الصلاحية</span>
                  <span className="text-rose-400 font-bold">عضو موثق (Cloud Player)</span>
                </div>
                <Trophy className="w-4 h-4 text-rose-400" />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">المزامنة السحابية</span>
                  <span className="text-emerald-400 font-medium">نشطة وتعمل في الوقت الفعلي</span>
                </div>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Test Tab Content */}
      {activeTab === 'cloud_test' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">تشخيص الاتصال السحابي المباشر</h3>
              <p className="text-xs text-slate-400 mt-1">
                قياس سرعة استجابة خادم Appwrite Cloud من متصفحك
              </p>
            </div>
            <button
              onClick={onTestPing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة فحص الاتصال</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">حالة السيرفر:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {cloudStatus.message}
              </span>
            </div>

            {cloudStatus.latencyMs !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">سرعة الاستجابة (Ping):</span>
                <span className="font-mono text-emerald-300 font-bold">
                  {cloudStatus.latencyMs} ميلي ثانية (ms)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">عنوان الخادم (Endpoint):</span>
              <span className="font-mono text-slate-300" dir="ltr">
                https://fra.cloud.appwrite.io/v1
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">معرف المشروع (Project ID):</span>
              <span className="font-mono text-slate-300" dir="ltr">
                6a9b9f2a00110d93d685
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
