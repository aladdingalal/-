import React from 'react';
import { Gamepad2, Cloud, CloudCheck, CloudAlert, Settings, LogOut, User } from 'lucide-react';
import type { CloudConnectionStatus, UserProfile } from '../types';

interface NavbarProps {
  status: CloudConnectionStatus;
  user: UserProfile | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  onTestPing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  user,
  onOpenSettings,
  onLogout,
  onTestPing,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 ring-1 ring-rose-400/30">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Tajawal']">Games farist</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">بوابة الألعاب والسحابة الموحدة</p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Health Ping Indicator */}
          <button
            onClick={onTestPing}
            title="انقر لإعادة فحص اتصال السحابة"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-all cursor-pointer"
          >
            {status.state === 'checking' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            {status.state === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
            {status.state === 'error' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            )}
            {status.state === 'idle' && (
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
            )}

            <span className="hidden md:inline">
              {status.state === 'checking' && 'جاري الفحص...'}
              {status.state === 'connected' && 'السحابة متصلة'}
              {status.state === 'error' && 'تنبيه اتصال السحابة'}
              {status.state === 'idle' && 'فحص السحابة'}
            </span>

            {status.latencyMs !== undefined && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-1 rounded">
                {status.latencyMs}ms
              </span>
            )}
          </button>

          {/* Cloud Config Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="إعدادات ومعلومات مشروع Appwrite السحابي"
            aria-label="إعدادات السحابة"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* If Logged In User */}
          {user && (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
              <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name[0].toUpperCase() : <User className="w-3 h-3" />}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[100px] truncate">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
