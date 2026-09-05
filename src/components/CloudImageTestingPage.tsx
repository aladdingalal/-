import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  FileText,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  Server,
  Download,
  Info,
  Sliders,
  Layers,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { UserProfile, CloudConnectionStatus, CloudFileItem } from '../types';
import {
  uploadCloudImage,
  listCloudImages,
  deleteCloudImage,
  saveDemoTestFile,
  getEffectiveBucketId,
  getStoredConfig,
  translateAppwriteError,
} from '../services/appwrite';

interface CloudImageTestingPageProps {
  user: UserProfile;
  cloudStatus: CloudConnectionStatus;
  onLogout: () => void;
  onOpenSettings: () => void;
  onTestPing: () => void;
  isDemo?: boolean;
}

export const CloudImageTestingPage: React.FC<CloudImageTestingPageProps> = ({
  user,
  cloudStatus,
  onLogout,
  onOpenSettings,
  onTestPing,
  isDemo = false,
}) => {
  const [files, setFiles] = useState<CloudFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'profile'>('upload');
  const [selectedInspectImage, setSelectedInspectImage] = useState<CloudFileItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customBucketId, setCustomBucketId] = useState<string>(getEffectiveBucketId());
  const [showBucketSettings, setShowBucketSettings] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    hint?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = getStoredConfig();

  // Load existing cloud files on mount
  const refreshFiles = async () => {
    setLoadingFiles(true);
    try {
      const items = await listCloudImages(customBucketId);
      setFiles(items);
    } catch (err: any) {
      console.warn('Refresh files warning:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, [customBucketId]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF, SVG)',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'حجم الصورة كبير جداً (الحد الأقصى الموصى به للاختبار 20 ميجابايت)',
      });
      return;
    }

    setSelectedFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Execute Upload
  const handleUpload = async (forceLocal = false) => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'يرجى اختيار صورة أولاً للرفع' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setMessage({
      type: 'info',
      text: forceLocal ? 'جاري محاكاة رفع الصورة للمعاينة...' : 'جاري رفع الصورة إلى سحابة Appwrite Storage...',
    });

    try {
      let uploadedItem: CloudFileItem;

      if (forceLocal || isDemo) {
        // Local preview simulation
        uploadedItem = await saveDemoTestFile(selectedFile);
        setUploadProgress(100);
        setMessage({
          type: 'success',
          text: 'تمت معالجة وتجربة الصورة بنجاح في المعاينة التجريبية!',
        });
      } else {
        // Real Appwrite Cloud Storage upload
        uploadedItem = await uploadCloudImage(selectedFile, customBucketId, (progress) => {
          setUploadProgress(progress);
        });
        setUploadProgress(100);
        setMessage({
          type: 'success',
          text: `تم رفع الصورة "${uploadedItem.name}" إلى سحابة Appwrite بنجاح!`,
        });
      }

      // Add to list and clear staging
      setFiles((prev) => [uploadedItem, ...prev.filter((f) => f.$id !== uploadedItem.$id)]);
      setSelectedFile(null);
      setPreviewDataUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      const translated = translateAppwriteError(err);

      // Check if it is a missing bucket error or permissions error
      const errLower = (err.message || '').toLowerCase();
      let hint = translated.hint;
      if (errLower.includes('storage_bucket_not_found') || errLower.includes('bucket not found')) {
        hint = `حاوية التخزين (Bucket: "${customBucketId}") غير موجودة في مشروع Appwrite. يمكنك إنشاؤها باسم "${customBucketId}" في Appwrite Console > Storage > Create Bucket، أو تجربة الرفع المحلي أدناه.`;
      } else if (errLower.includes('unauthorized') || err.code === 401 || err.code === 403) {
        hint = `تأكد من إعطاء صلاحيات القراءة والكتابة (Permissions) لـ Any أو Users داخل إعدادات الحاوية (${customBucketId}) في Appwrite Console.`;
      }

      setMessage({
        type: 'error',
        text: `فشل الرفع السحابي: ${translated.text}`,
        hint,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Delete an image
  const handleDelete = async (fileId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الصورة من الاختبارات السحابية؟')) return;

    try {
      await deleteCloudImage(fileId, customBucketId);
      setFiles((prev) => prev.filter((f) => f.$id !== fileId));
      if (selectedInspectImage?.$id === fileId) {
        setSelectedInspectImage(null);
      }
      setMessage({ type: 'success', text: 'تم حذف الصورة بنجاح.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'تعذر حذف الصورة: ' + err.message });
    }
  };

  // Copy URL to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ك.بايت';
    return (bytes / (1024 * 1024)).toFixed(2) + ' م.بايت';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Welcome Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-lg shadow-rose-500/25 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-300">
                <UploadCloud className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
                  مركز اختبارات السحاب - رفع وإدارة الصور
                </h1>
                {isDemo && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    وضع المعاينة
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                مرحباً بك، <span className="text-slate-200 font-semibold">{user.name || user.email}</span> • بيانات سحابة Appwrite محفوظة وجاهزة للموقع الحقيقي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={onTestPing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/70 transition-colors"
              title="فحص سرعة استجابة السحابة"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{cloudStatus.latencyMs !== undefined ? `${cloudStatus.latencyMs}ms` : 'فحص السحابة'}</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-xs font-bold border border-slate-700/70 transition-colors"
              title="تسجيل الخروج والعودة لشاشة الدخول"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-2 transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-rose-500 text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-rose-400" />
            <span>معمل رفع واختبار الصور ({files.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-2 transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'border-rose-500 text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4 text-indigo-400" />
            <span>بيانات الاعتماد السحابية المحفوظة</span>
          </button>
        </div>
      </div>

      {activeTab === 'upload' && (
        <>
          {/* Cloud Info & Bucket Configuration Ribbon */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-300">
              <Server className="w-4 h-4 text-rose-400 shrink-0" />
              <span>المشروع السحابي:</span>
              <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-200 text-[11px]" dir="ltr">
                {config.projectId}
              </span>
              <span className="text-slate-500">•</span>
              <span>حاوية التخزين (Bucket ID):</span>
              <span className="font-mono bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 text-[11px]" dir="ltr">
                {customBucketId}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBucketSettings(!showBucketSettings)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-[11px]"
              >
                <Sliders className="w-3 h-3" />
                <span>تعديل معرّف الحاوية (Bucket)</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-rose-400 hover:underline text-[11px]"
              >
                <span>إعدادات CORS والربط</span>
              </button>
            </div>
          </div>

          {/* Collapsible Bucket Settings */}
          {showBucketSettings && (
            <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">تخصيص معرّف حاوية التخزين (Appwrite Storage Bucket ID):</span>
                <button
                  onClick={() => setShowBucketSettings(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                إذا أنشأت حاوية في Appwrite Cloud (تحت Storage &gt; Buckets) باسم أو ID مختلف، اكتب معرفها هنا لاستخدامها فوراً:
              </p>
              <div className="flex items-center gap-2 max-w-md" dir="ltr">
                <input
                  type="text"
                  value={customBucketId}
                  onChange={(e) => setCustomBucketId(e.target.value)}
                  placeholder="test-images"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowBucketSettings(false);
                    refreshFiles();
                    setMessage({ type: 'success', text: `تم تعيين الحاوية إلى: ${customBucketId}` });
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shrink-0 text-xs"
                >
                  حفظ وتطبيق
                </button>
              </div>
            </div>
          )}

          {/* Upload Box (Drag & Drop + File Selection) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-rose-500" />
                  <span>رفع صورة جديدة لتجربة السحابة</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  يدعم السحب والإفلات، ومعاينة الصورة الفورية، وتوليد روابط سريعة
                </p>
              </div>

              {selectedFile && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء التحديد</span>
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none ${
                isDragging
                  ? 'border-rose-500 bg-rose-500/10 scale-[0.99]'
                  : previewDataUrl
                  ? 'border-slate-700 bg-slate-950/40'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/90'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="cloud-image-file-input"
              />

              {previewDataUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-5 w-full max-w-md">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 shadow-lg relative group">
                    <img
                      src={previewDataUrl}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-right space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate" title={selectedFile?.name}>
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      الحجم: {selectedFile ? formatFileSize(selectedFile.size) : ''}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      النوع: {selectedFile?.type || 'صورة'}
                    </p>
                    <span className="inline-block text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      جاهزة للرفع السحابي
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto ring-1 ring-rose-500/20">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      اسحب وأفلت الصورة هنا، أو <span className="text-rose-400 underline">انقر للتصفح</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      يدعم PNG، JPG، WEBP، GIF، SVG (حتى 20 ميجابايت)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>جاري إرسال البيانات لسحابة Appwrite...</span>
                  <span className="font-mono font-bold text-rose-400">
                    {uploadProgress !== null ? `${uploadProgress}%` : ''}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-rose-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress || 20}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={() => handleUpload(false)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#fd366e] hover:bg-[#e62b60] text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>رفع إلى سحابة Appwrite</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={() => handleUpload(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="تجربة المعاينة المحلية بدون إرسال إلى الحاوية"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>معاينة تجريبية فورية</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>الصور المرفوعة ستكون متاحة للموقع عند التصميم</span>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                  message.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : message.type === 'error'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {message.type === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {message.type === 'error' && (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{message.text}</p>
                    {message.hint && (
                      <p className="text-slate-400 text-[11px] leading-normal">{message.hint}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Images Gallery & Test Lab */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  <span>معرض صور اختبارات السحاب ({files.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  يمكنك استعراض الصور المرفوعة، نسخ روابطها السحابية المباشرة واختبارها
                </p>
              </div>

              <button
                type="button"
                onClick={refreshFiles}
                disabled={loadingFiles}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">لا توجد صور اختبارية مرفوعة بعد</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  قم باختيار صورة وسحبها في الصندوق أعلاه لتجربة سرعة الرفع وحفظها في السحابة
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                  return (
                    <div
                      key={file.$id}
                      className="group relative bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all flex flex-col"
                    >
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => setSelectedInspectImage(file)}
                        className="relative w-full h-40 bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        <img
                          src={file.previewUrl || file.viewUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // fallback icon if remote CORS or 404
                            (e.target as any).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-semibold flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة وتفاصيل</span>
                          </span>
                        </div>

                        {file.isLocalMock && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            معاينة تجريبية
                          </span>
                        )}
                        {!file.isLocalMock && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Appwrite Cloud
                          </span>
                        )}
                      </div>

                      {/* Info & Actions */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <p className="text-xs font-bold text-slate-100 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                            <span>{formatFileSize(file.sizeOriginal)}</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {file.$id.slice(0, 10)}...
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleCopy(file.viewUrl, file.$id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs rounded-lg transition-colors"
                            title="نسخ رابط العرض السحابي المباشر"
                          >
                            {copiedId === file.$id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] text-emerald-400">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px]">نسخ الرابط</span>
                              </>
                            )}
                          </button>

                          <a
                            href={file.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
                            title="فتح الرابط في نافذة جديدة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDelete(file.$id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Profile & Saved Cloud Credentials Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Credentials Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>بيانات الاعتماد السحابية المحفوظة</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              جميع بيانات السحابة محفوظة في التطبيق ومجهزة لتوصيل الموقع الحقيقي لاحقاً:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">خادم السحابة (Endpoint)</span>
                <span className="font-mono text-slate-200" dir="ltr">
                  {config.endpoint}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">معرف المشروع (Project ID)</span>
                <span className="font-mono text-rose-300 font-bold" dir="ltr">
                  {config.projectId}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">حاوية التخزين النشطة (Bucket ID)</span>
                <span className="font-mono text-indigo-300 font-bold" dir="ltr">
                  {customBucketId}
                </span>
              </div>
            </div>
          </div>

          {/* User Account Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-rose-400" />
              <span>حساب المستخدم النشط</span>
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">اسم المستخدم</span>
                <span className="text-white font-semibold">{user.name || 'لاعب Games farist'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">البريد الإلكتروني</span>
                <span className="font-mono text-slate-200" dir="ltr">{user.email}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">معرف الحساب السحابي ($id)</span>
                <span className="font-mono text-slate-300 text-[11px]" dir="ltr">{user.$id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Image Modal */}
      {selectedInspectImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-rose-400" />
                <h4 className="text-sm font-bold text-white truncate max-w-md">
                  تفاصيل الصورة: {selectedInspectImage.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedInspectImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Preview */}
            <div className="w-full max-h-80 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              <img
                src={selectedInspectImage.viewUrl}
                alt={selectedInspectImage.name}
                className="max-h-80 object-contain w-full"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Metadata Table */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-0.5">الحجم</span>
                <span className="text-slate-200 font-mono">
                  {formatFileSize(selectedInspectImage.sizeOriginal)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-0.5">المعرف الفريد ($id)</span>
                <span className="text-slate-200 font-mono text-[11px]" dir="ltr">
                  {selectedInspectImage.$id}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 col-span-2">
                <span className="text-slate-500 block mb-0.5">رابط العرض السحابي (URL):</span>
                <div className="flex items-center justify-between gap-2" dir="ltr">
                  <span className="font-mono text-[11px] text-rose-300 truncate">
                    {selectedInspectImage.viewUrl}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedInspectImage.viewUrl, 'modal_copy')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs shrink-0"
                  >
                    {copiedId === 'modal_copy' ? 'تم النسخ!' : 'نسخ'}
                  </button>
                </div>
              </div>
            </div>

            {/* Code Snippet for developers */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <span className="text-slate-400 block font-bold">كود استدعاء هذه الصورة في واجهة الموقع الحقيقي:</span>
              <pre className="font-mono text-slate-300 p-2 bg-slate-900 rounded overflow-x-auto text-[10px]" dir="ltr">
                {`// Appwrite Storage
const viewUrl = storage.getFileView("${selectedInspectImage.bucketId}", "${selectedInspectImage.$id}");`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
