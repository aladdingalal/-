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
  const [bucketId, setBucketId] = useState(currentConfig.bucketId || 'test-images');
  const [saved, setSaved] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredConfig({
      endpoint: endpoint.trim(),
      projectId: projectId.trim(),
      bucketId: bucketId.trim() || 'test-images',
    });
    setSaved(true);
    onConfigUpdated();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const def = resetStoredConfig();
    setEndpoint(def.endpoint);
    setProjectId(def.projectId);
    setBucketId(def.bucketId || 'test-images');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-['Tajawal']">إعدادات سحابة Appwrite</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note on CORS / Web Platforms */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-2 font-bold text-rose-700">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>تلميح مهم لربط Appwrite (تخطي حظر CORS):</span>
          </div>
          <p className="leading-relaxed text-slate-600 text-[11px]">
            للسماح للمتصفح بالاتصال بمشروعك السحابي دون أي قيود، يجب إضافة نطاق هذا الموقع في لوحة تحكم
            Appwrite ضمن <strong>Overview &gt; Web Platforms</strong>:
          </p>
          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-rose-200" dir="ltr">
            <span className="font-mono text-xs text-rose-700 font-bold truncate">{currentOrigin}</span>
            <button
              type="button"
              onClick={copyOrigin}
              className="px-2.5 py-1 text-xs rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center gap-1 font-bold shrink-0 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedOrigin ? 'تم النسخ' : 'نسخ النطاق'}</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Endpoint */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>رابط نقطة النهاية (Appwrite Endpoint):</span>
            </label>
            <input
              type="url"
              required
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://fra.cloud.appwrite.io/v1"
              dir="ltr"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {/* Project ID */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              <span>معرّف المشروع السحابي (Project ID):</span>
            </label>
            <input
              type="text"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="6a9b9f2a00110d93d685"
              dir="ltr"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {/* Storage Bucket ID */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-500" />
              <span>معرّف حاوية التخزين (Storage Bucket ID):</span>
            </label>
            <input
              type="text"
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              placeholder="test-images"
              dir="ltr"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold rounded-xl shadow-md shadow-rose-500/20 hover:opacity-95 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {saved && <CheckCircle className="w-4 h-4 text-white" />}
                <span>{saved ? 'تم الحفظ بنجاح' : 'حفظ الإعدادات'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
