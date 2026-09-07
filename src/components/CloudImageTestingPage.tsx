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
  ArrowRight,
  ShoppingBag,
  MapPin,
  Phone,
  Building,
  Globe,
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
  onBackToStore?: () => void;
}

export const CloudImageTestingPage: React.FC<CloudImageTestingPageProps> = ({
  user,
  cloudStatus,
  onLogout,
  onOpenSettings,
  onTestPing,
  isDemo = false,
  onBackToStore,
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
        text: 'الملف المحدد ليس صورة صالحة. يرجى اختيار ملف صورة (PNG, JPG, WEBP, SVG).',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 20 ميجابايت.',
      });
      return;
    }

    setSelectedFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewDataUrl(e.target?.result as string);
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

  // Execute upload
  const handleUpload = async (forceDemo: boolean = false) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setMessage({
      type: 'info',
      text: 'جاري تجهيز الصورة والاتصال بسحابة Appwrite Storage...',
    });

    try {
      if (forceDemo) {
        setUploadProgress(60);
        await new Promise((r) => setTimeout(r, 600));
        const demoItem = await saveDemoTestFile(selectedFile);
        setUploadProgress(100);
        setFiles((prev) => [demoItem, ...prev]);
        setMessage({
          type: 'success',
          text: 'تمت إضافة الصورة بنجاح في معمل المعاينة السريعة!',
        });
        setSelectedFile(null);
        setPreviewDataUrl(null);
        return;
      }

      setUploadProgress(50);
      const uploadedItem = await uploadCloudImage(selectedFile, customBucketId, (pct) => {
        setUploadProgress(Math.max(20, Math.min(95, pct)));
      });

      setUploadProgress(100);
      setFiles((prev) => [uploadedItem, ...prev]);
      setMessage({
        type: 'success',
        text: 'تم رفع الصورة بنجاح إلى سحابة Appwrite وحفظ بيانات الاختبار!',
      });
      setSelectedFile(null);
      setPreviewDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload failed:', err);
      const translated = translateAppwriteError(err);
      let hint = translated.hint;
      if (err.code === 404 || err.message?.includes('not found')) {
        hint = `الحاوية (${customBucketId}) غير موجودة حالياً في مشروع Appwrite. يمكنك إنشاؤها باسم 'test-images' أو تغيير المعرف أدناه.`;
      } else if (err.code === 401 || err.code === 403) {
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
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-800">
      {/* Top Welcome Bar in Light RGB theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-50 via-sky-50 to-indigo-50 border border-slate-200/90 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 p-0.5 shadow-md shadow-rose-500/20 shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-rose-600">
                <UploadCloud className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-['Tajawal'] tracking-tight">
                  معمل اختبارات سحابة Appwrite للصور
                </h1>
                {isDemo && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    وضع المعاينة
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                مرحباً بك، <strong className="text-rose-600 font-bold">{user.name || user.email}</strong> • كافة بيانات السحاب مخزنة ومحفوظة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
                <span>العودة للمتجر</span>
              </button>
            )}

            <button
              onClick={onTestPing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-xs"
              title="فحص سرعة استجابة السحابة"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
              <span>{cloudStatus.latencyMs !== undefined ? `${cloudStatus.latencyMs}ms` : 'فحص السحابة'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-2 transition-all border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-rose-500 text-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span>معمل رفع واختبار الصور ({files.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-2 transition-all border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-slate-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4 text-indigo-500" />
            <span>بيانات العضو والعنوان والتسجيل</span>
          </button>
        </div>
      </div>

      {activeTab === 'upload' && (
        <>
          {/* Cloud Info & Bucket Configuration Ribbon */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-700">
              <Server className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-semibold">المشروع السحابي:</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-900 text-[11px]" dir="ltr">
                {config.projectId}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold">حاوية التخزين (Bucket ID):</span>
              <span className="font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 text-[11px] font-bold" dir="ltr">
                {customBucketId}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBucketSettings(!showBucketSettings)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-bold cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>تعديل معرّف الحاوية</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold cursor-pointer"
              >
                <span>إعدادات CORS والربط</span>
              </button>
            </div>
          </div>

          {/* Collapsible Bucket Settings */}
          {showBucketSettings && (
            <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3 text-xs shadow-md animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">تخصيص معرّف حاوية التخزين (Storage Bucket ID):</span>
                <button
                  onClick={() => setShowBucketSettings(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                إذا أنشأت حاوية في Appwrite Cloud (تحت Storage &gt; Buckets) باسم أو ID مختلف، اكتب معرفها هنا لاستخدامها فوراً:
              </p>
              <div className="flex items-center gap-2 max-w-md" dir="ltr">
                <input
                  type="text"
                  value={customBucketId}
                  onChange={(e) => setCustomBucketId(e.target.value)}
                  placeholder="test-images"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowBucketSettings(false);
                    refreshFiles();
                    setMessage({ type: 'success', text: `تم تعيين الحاوية إلى: ${customBucketId}` });
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shrink-0 text-xs shadow-xs cursor-pointer"
                >
                  حفظ وتطبيق
                </button>
              </div>
            </div>
          )}

          {/* Upload Box (Drag & Drop + File Selection) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-rose-500" />
                  <span>رفع صورة جديدة لتجربة السحابة</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
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
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
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
                  ? 'border-rose-500 bg-rose-50 scale-[0.99]'
                  : previewDataUrl
                  ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-300 hover:border-rose-400 bg-slate-50/70 hover:bg-slate-50'
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
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-md relative group">
                    <img
                      src={previewDataUrl}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-right space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate" title={selectedFile?.name}>
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      الحجم: {selectedFile ? formatFileSize(selectedFile.size) : ''}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      النوع: {selectedFile?.type || 'صورة'}
                    </p>
                    <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                      جاهزة للرفع السحابي
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      اسحب وأفلت الصورة هنا، أو <span className="text-rose-600 underline font-bold">انقر للتصفح</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      يدعم PNG، JPG، WEBP، GIF، SVG (حتى 20 ميجابايت)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>جاري الإرسال إلى خوادم السحاب...</span>
                  <span>{uploadProgress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress || 10}%` }}
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
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>رفع إلى سحابة Appwrite</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={() => handleUpload(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="تجربة المعاينة المحلية بدون إرسال إلى الحاوية"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>معاينة تجريبية فورية</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-sky-500" />
                <span>الصور المرفوعة تظل محفوظة في السحابة</span>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : message.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-sky-50 border-sky-200 text-sky-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {message.type === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {message.type === 'error' && (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{message.text}</p>
                    {message.hint && (
                      <p className="text-slate-600 text-[11px] leading-normal">{message.hint}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Images Gallery & Test Lab */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-500" />
                  <span>معرض صور اختبارات السحاب ({files.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يمكنك استعراض الصور المرفوعة، نسخ روابطها السحابية المباشرة واختبارها
                </p>
              </div>

              <button
                type="button"
                onClick={refreshFiles}
                disabled={loadingFiles}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">لا توجد صور اختبارية مرفوعة بعد</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  قم باختيار صورة وسحبها في الصندوق أعلاه لتجربة سرعة الرفع وحفظها في السحابة
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div
                    key={file.$id}
                    className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={file.previewUrl || file.viewUrl}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {file.isLocalMock && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                          معاينة محلية
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedInspectImage(file)}
                        className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>فحص الروابط السحابية</span>
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatFileSize(file.sizeOriginal)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(file.viewUrl, file.$id)}
                          className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium cursor-pointer"
                          title="نسخ رابط العرض السحابي"
                        >
                          {copiedId === file.$id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[11px] text-emerald-600 font-bold">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">نسخ الرابط</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={file.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="فتح في تبويب جديد"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(file.$id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف من السحابة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {user.name ? user.name[0] : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Tajawal']">
                بيانات العضو والعنوان المسجل
              </h3>
              <p className="text-xs text-slate-500">
                المعرّف السحابي (Account ID): <span className="font-mono text-slate-800" dir="ltr">{user.$id}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1">الاسم الكامل</span>
              <span className="font-bold text-slate-900 text-sm">{user.name || 'غير محدد'}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1">البريد الإلكتروني</span>
              <span className="font-bold text-slate-900 font-mono" dir="ltr">{user.email}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1">رقم الهاتف</span>
              <span className="font-bold text-emerald-600 font-mono text-sm" dir="ltr">
                {user.phone || 'غير مسجل'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1">بلد الإقامة</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>{user.residenceCountry || 'المملكة العربية السعودية'}</span>
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1">المدينة الحالية</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>{user.currentCity || 'الرياض'}</span>
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2 md:col-span-1">
              <span className="text-slate-400 block mb-1">العنوان التفصيلي للشحن والتوصيل</span>
              <span className="font-medium text-slate-700 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{user.detailedAddress || 'حي النرجس، شارع عثمان بن عفان، مبنى 14'}</span>
              </span>
            </div>
          </div>

          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-center justify-between">
            <span>بياناتك السحابية وعنوانك التفصيلي متصلة تلقائياً بالمتجر لسرعة إتمام طلبات الملابس والإكسسوارات.</span>
            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="font-bold text-sky-700 hover:underline shrink-0 mr-2 cursor-pointer"
              >
                تصفح المتجر الآن
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedInspectImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="font-bold text-sm text-slate-900">تفاصيل وروابط الصورة السحابية</h4>
              <button
                onClick={() => setSelectedInspectImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              <img
                src={selectedInspectImage.viewUrl}
                alt={selectedInspectImage.name}
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">رابط العرض المباشر (View URL):</label>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200" dir="ltr">
                  <span className="font-mono text-[11px] text-slate-800 truncate flex-1">{selectedInspectImage.viewUrl}</span>
                  <button
                    onClick={() => handleCopy(selectedInspectImage.viewUrl, 'inspect-view')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 shrink-0 cursor-pointer"
                  >
                    {copiedId === 'inspect-view' ? 'تم النسخ' : 'نسخ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
