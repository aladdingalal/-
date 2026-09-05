import React, { useState } from 'react';
import {
  X,
  Server,
  Key,
  Globe,
  Copy,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { DEFAULT_CONFIG, getStoredConfig, saveStoredConfig, resetStoredConfig } from '../services/appwrite';
import type { CloudConfig } from '../types';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  if (!isOpen) return null;

  const currentConfig = getStoredConfig();
  const [endpoint, setEndpoint] = useState(currentConfig.endpoint);
  const [projectId, setProjectId] = useState(currentConfig.projectId);
  const [saved, setSaved] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredConfig({ endpoint: endpoint.trim(), projectId: projectId.trim() });
    setSaved(true);
    onConfigUpdated();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const def = resetStoredConfig();
    setEndpoint(def.endpoint);
    setProjectId(def.projectId);
    setSaved(true);
    onConfigUpdated();
    setTimeout(() => setSaved(false), 2000);
  };

  const copyOrigin = () => {
    if (currentOrigin) {
      navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <Server className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold font-['Tajawal']">إعدادات سحابة Appwrite</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note on CORS / Web Platforms */}
        <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs space-y-2 text-rose-200">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>تلميح مهم لربط Appwrite (تخطي حظر CORS):</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            للسماح للمتصفح بالاتصال بمشروعك السحابي دون أي قيود، يجب إضافة نطاق هذا الموقع في لوحة تحكم
            Appwrite ضمن <strong>Overview &gt; Web Platforms</strong>:
          </p>
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800" dir="ltr">
            <span className="font-mono text-xs text-rose-300 truncate">{currentOrigin}</span>
            <button
              type="button"
              onClick={copyOrigin}
              className="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors shrink-0"
            >
              {copiedOrigin ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النطاق</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Auth Guide */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>تفعيل تسجيل الدخول بحسابات التواصل (OAuth):</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            يدعم النظام تسجيل الدخول عبر Google وDiscord وGitHub وFacebook. لتفعيل أي منها، افتح لوحة تحكم Appwrite لمشروعك &gt; <strong>Auth &gt; Settings &gt; OAuth2 Providers</strong> وفعّل المزود وضع مفاتيحه.
          </p>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              عنوان الخادم السحابي (Endpoint URL):
            </label>
            <input
              type="url"
              required
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://fra.cloud.appwrite.io/v1"
              dir="ltr"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              معرف المشروع (Project ID):
            </label>
            <input
              type="text"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="6a9b9f2a00110d93d685"
              dir="ltr"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          {saved && (
            <p className="text-emerald-400 font-bold text-xs text-center">
              ✓ تم حفظ الإعدادات وتحديث عميل Appwrite بنجاح!
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/20"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
