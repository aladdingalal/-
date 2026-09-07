import React, { useState } from 'react';
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  MapPin,
  Phone,
  Building,
  Globe,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Award,
  Gift,
  Coins,
  Clock,
  Shirt,
} from 'lucide-react';
import type { UserProfile, CloudConnectionStatus, UserRegistrationData } from '../types';
import { getPointsHistory } from '../services/appwrite';

interface OptionalAuthTopBarProps {
  user: UserProfile | null;
  cloudStatus: CloudConnectionStatus;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (data: UserRegistrationData) => Promise<void>;
  onLogout: () => void;
  onOpenCloudSettings: () => void;
  onOpenCloudLab: () => void;
  onOpenProfilePopup?: () => void;
  loading: boolean;
  errorMsg: { text: string; hint?: string } | null;
  successMsg: string | null;
  onClearMessages: () => void;
}

export const OptionalAuthTopBar: React.FC<OptionalAuthTopBarProps> = ({
  user,
  cloudStatus,
  isExpanded,
  onToggleExpand,
  onLogin,
  onRegister,
  onLogout,
  onOpenCloudSettings,
  onOpenCloudLab,
  onOpenProfilePopup,
  loading,
  errorMsg,
  successMsg,
  onClearMessages,
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (including the requested fields: residence, detailed address, phone, current city)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('جمهورية مصر العربية');
  const [regCity, setRegCity] = useState('القاهرة');
  const [regAddress, setRegAddress] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    await onLogin(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regPhone || !regAddress) return;
    await onRegister({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      residenceCountry: regCountry,
      currentCity: regCity,
      detailedAddress: regAddress,
    });
  };

  return (
    <aside aria-label="الشريط العلوي الاختياري للحساب والتسجيل" className="w-full bg-gradient-to-r from-rose-50/80 via-white to-amber-50/80 border-b border-slate-200/80 shadow-xs relative z-40 text-slate-800 transition-all duration-300">
      {/* Mini Bar Always Visible */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Right side info / User summary (No technical cloud data) */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-linear-to-tr from-rose-500 to-indigo-500 text-white font-bold text-[11px] shadow-xs">
                {user.name ? user.name[0] : 'U'}
              </span>
              <span className="font-bold text-slate-800">
                مرحباً، <span className="text-rose-600">{user.name || user.email}</span>
              </span>

              {/* Loyalty points badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-[11px] shadow-xs border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-900 fill-amber-500" />
                <span>{user.loyaltyPoints ?? 50} نقطة مكافآت</span>
              </span>

              {user.currentCity && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>{user.currentCity}</span>
                  {user.residenceCountry && <span>- {user.residenceCountry}</span>}
                </span>
              )}

              {user.phone && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200" dir="ltr">
                  <Phone className="w-3 h-3 text-sky-500" />
                  <span>{user.phone}</span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold text-slate-900 font-['Tajawal'] text-[13px]">
                متجر فهد (FAHAD):
              </span>
              <span className="text-slate-600 hidden sm:inline">
                يشرفنا تسجيلك معانا واحصل على 50 نقطة مكافأة فورية ونقاط إضافية مع كل طلب!
              </span>
              <span className="text-slate-600 sm:hidden">
                يشرفنا تسجيلك معانا واكسب نقاط المكافآت!
              </span>
            </div>
          )}
        </div>

        {/* Left side actions (Clean customer actions, no cloud ping clutter) */}
        <div className="flex items-center gap-2">
          {user && onOpenProfilePopup && (
            <button
              type="button"
              onClick={onOpenProfilePopup}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-xs hover:opacity-95 cursor-pointer border border-amber-300"
              title="فتح نافذة الملف الشخصي والرسائل المنبثقة من أعلى الموقع"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>نافذة الملف والرسائل</span>
            </button>
          )}

          {/* Toggle Expand Button */}
          <button
            type="button"
            onClick={() => {
              onClearMessages();
              onToggleExpand();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer ${
              isExpanded
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white hover:opacity-95'
            }`}
          >
            {user ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span>{isExpanded ? 'إخفاء الملف والمكافآت' : 'الملف الشخصي ونقاط المكافآت'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>{isExpanded ? 'إغلاق شريط التسجيل' : 'تسجيل الدخول / يشرفنا تسجيلك معانا'}</span>
              </>
            )}
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {user && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Content Panel */}
      {isExpanded && (
        <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-6 shadow-inner animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-4xl mx-auto">
            {/* Feedback Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{errorMsg.text}</p>
                  {errorMsg.hint && <p className="text-red-600 text-[11px] mt-0.5">{errorMsg.hint}</p>}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="font-bold">{successMsg}</p>
              </div>
            )}

            {/* If user is logged in, show their registered profile details & loyalty points */}
            {user ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                {/* Header Profile Title */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                      {user.name ? user.name[0] : 'ف'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-['Tajawal'] flex items-center gap-2">
                        <span>الملف الشخصي للعميل ومكافآت متجر فهد</span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-sans font-bold">
                          FAHAD VIP
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        البريد المسجل: <span className="font-mono text-slate-700" dir="ltr">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>

                {/* Golden Loyalty Points Banner (Requested) */}
                <div className="bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-2xl p-4 sm:p-5 text-slate-950 shadow-md border border-amber-300 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950/10 text-xs font-black">
                        <Sparkles className="w-3.5 h-3.5 text-amber-950 fill-amber-900" />
                        <span>رصيد نقاط الولاء والمكافآت في متجر فهد</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black font-['Tajawal'] text-slate-950">
                          {user.loyaltyPoints ?? 50}
                        </span>
                        <span className="text-sm font-bold text-slate-900">نقطة مكافآت</span>
                        <span className="text-xs font-medium text-slate-800 bg-white/70 px-2 py-0.5 rounded-md border border-amber-300/80 mr-2">
                          تساوي {(((user.loyaltyPoints ?? 50) * 0.1)).toFixed(1)} ج.م رصيد خصم
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">
                        يتم إضافة نقاط تلقائياً لملفك الشخصي مع كل عملية شراء للملابس والإكسسوارات من متجر فهد!
                      </p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 text-xs shrink-0 space-y-1 text-right">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>
                          {(user.loyaltyPoints ?? 50) >= 500
                            ? 'العضوية الماسية VIP 💎'
                            : (user.loyaltyPoints ?? 50) >= 200
                            ? 'العضوية الذهبية 🥇'
                            : 'العضوية الفضية 🥈'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        10% من قيمة كل طلب تضاف مباشرة كنقاط لحسابك.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Points Activity Log */}
                {(() => {
                  const pointsHistory = getPointsHistory(user.email);
                  return pointsHistory.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>سجل حركات النقاط والمكافآت الأخيرة:</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {pointsHistory.length} حركة مسجلة
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {pointsHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                                +
                              </span>
                              <div>
                                <p className="font-bold text-slate-800">{item.reason}</p>
                                <p className="text-slate-400 text-[10px]">{item.date}</p>
                              </div>
                            </div>
                            <span className="font-bold text-emerald-600 font-mono text-xs">
                              +{item.points} نقطة
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Grid of User Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">الاسم الكامل</span>
                    <span className="font-bold text-slate-800 text-sm">{user.name || 'غير محدد'}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">البريد الإلكتروني</span>
                    <span className="font-bold text-slate-800 font-mono text-xs" dir="ltr">{user.email}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">رقم الهاتف</span>
                    <span className="font-bold text-emerald-600 font-mono" dir="ltr">
                      {user.phone || 'لم يتم تسجيله بعد'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">بلد الإقامة</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-sky-500" />
                      <span>{user.residenceCountry || 'جمهورية مصر العربية'}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">المحافظة الحالية</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{user.currentCity || 'القاهرة'}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2 md:col-span-1">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">العنوان التفصيلي للشحن</span>
                    <span className="font-medium text-slate-700 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{user.detailedAddress || 'حي النرجس، شارع عثمان بن عفان، مبنى 14'}</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                  <span>تم حفظ بيانات إقامتك وعنوانك التفصيلي لاستخدامها تلقائياً عند طلب الملابس والإكسسوارات من متجر فهد.</span>
                  <button
                    onClick={onToggleExpand}
                    className="text-rose-600 font-bold hover:underline shrink-0 mr-2 cursor-pointer"
                  >
                    متابعة التسوق
                  </button>
                </div>
              </div>
            ) : (
              /* If user not logged in: show Login or Register tab */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
                {/* Mode Switcher */}
                <div className="flex items-center justify-center max-w-sm mx-auto p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      onClearMessages();
                      setAuthTab('login');
                    }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      authTab === 'login'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-rose-500" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearMessages();
                      setAuthTab('register');
                    }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      authTab === 'register'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>يشرفنا تسجيلك معانا</span>
                  </button>
                </div>

                {authTab === 'login' ? (
                  /* Login Form (No social auth, no guest login) */
                  <form onSubmit={handleLoginSubmit} className="max-w-md mx-auto space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        البريد الإلكتروني المسجل:
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        dir="ltr"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        كلمة المرور:
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>جاري التحقق...</span>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>تسجيل الدخول إلى متجر فهد</span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-slate-500">
                      ليس لديك حساب؟{' '}
                      <button
                        type="button"
                        onClick={() => setAuthTab('register')}
                        className="text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        يشرفنا تسجيلك معانا
                      </button>
                    </p>
                  </form>
                ) : (
                  /* Register Form with Requested Extended Fields */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                    {/* Welcoming banner */}
                    <div className="p-3 bg-linear-to-r from-indigo-50 to-rose-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        يشرفنا تسجيلك معانا في متجر فهد (FAHAD)! سجّل بياناتك الآن واحصل على <strong>50 نقطة مكافأة ترحيبية فورية</strong> ونقاط إضافية مع كل عملية شراء.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Full Name */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          الاسم الكامل: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="محمد أحمد"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          البريد الإلكتروني: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@domain.com"
                          dir="ltr"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          كلمة المرور (8 أحرف أو أكثر): <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          dir="ltr"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                        />
                      </div>

                      {/* Phone Number (Requested) */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          رقم الهاتف: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="01012345678"
                          dir="ltr"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                        />
                      </div>

                      {/* Residence Country (Requested) */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          بلد الإقامة: <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={regCountry}
                          onChange={(e) => setRegCountry(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                        >
                          <option value="جمهورية مصر العربية">جمهورية مصر العربية</option>
                          <option value="المملكة العربية السعودية">المملكة العربية السعودية</option>
                          <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</option>
                          <option value="الكويت">الكويت</option>
                          <option value="قطر">قطر</option>
                          <option value="البحرين">البحرين</option>
                          <option value="عمان">عمان</option>
                          <option value="الأردن">الأردن</option>
                          <option value="العراق">العراق</option>
                          <option value="المغرب">المغرب</option>
                          <option value="أخرى">دولة أخرى</option>
                        </select>
                      </div>

                      {/* Current City (Requested) */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          المدينة الحالية: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          placeholder="الرياض، جدة، القاهرة، دبي..."
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Detailed Address (Requested) */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        العنوان التفصيلي (الشارع، الحي، رقم المبنى، الرمز البريدي): <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="مثال: حي العليا، طريق الملك فهد، عمارة الأمل، شقة 4"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <p className="text-[11px] text-slate-500">
                        يشرفنا تسجيلك معنا! سيتم حفظ عنوان الشحن وإضافة 50 نقطة مكافأة فورية في محفظتك.
                      </p>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <span>جاري إنشاء الحساب...</span>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>يشرفنا تسجيلك معانا وإنشاء الحساب</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
