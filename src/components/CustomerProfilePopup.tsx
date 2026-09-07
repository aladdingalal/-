import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MessageSquare,
  Sparkles,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building,
  RefreshCw,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  Cloud,
  Key,
  Layers,
  ShoppingBag,
  LogIn,
  UserPlus,
  AlertCircle,
  Check,
} from 'lucide-react';
import type {
  UserProfile,
  CustomerMessage,
  CloudConnectionStatus,
  UserRegistrationData,
} from '../types';
import {
  getRetainedCustomerMessages,
  sendAndRetainCustomerMessage,
  deleteRetainedCustomerMessage,
  getPointsHistory,
} from '../services/appwrite';

interface CustomerProfilePopupProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onLogin?: (email: string, pass: string) => Promise<void>;
  onRegister?: (data: UserRegistrationData) => Promise<void>;
  loadingAuth?: boolean;
  authError?: { text: string; hint?: string } | null;
  authSuccess?: string | null;
  onClearMessages?: () => void;
  cloudStatus?: CloudConnectionStatus;
  onOpenSettings?: () => void;
}

export const CustomerProfilePopup: React.FC<CustomerProfilePopupProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  onLogin,
  onRegister,
  loadingAuth = false,
  authError = null,
  authSuccess = null,
  onClearMessages,
  cloudStatus,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'updates' | 'login' | 'register'>('profile');
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Guest login form state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPass, setGuestPass] = useState('');

  // Guest register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('جمهورية مصر العربية');
  const [regCity, setRegCity] = useState('القاهرة');
  const [regAddress, setRegAddress] = useState('');

  // New message form state
  const [newSubject, setNewSubject] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [senderNameInput, setSenderNameInput] = useState('');
  const [senderEmailInput, setSenderEmailInput] = useState('');
  const [senderPhoneInput, setSenderPhoneInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageAlert, setMessageAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-switch default tab based on whether user is logged in
  useEffect(() => {
    if (user) {
      if (activeTab === 'login' || activeTab === 'register') {
        setActiveTab('profile');
      }
    } else {
      if (activeTab === 'profile' || activeTab === 'messages') {
        setActiveTab('login');
      }
    }
  }, [user]);

  // Fetch messages when opened
  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const list = await getRetainedCustomerMessages();
      setMessages(list);
    } catch (err) {
      console.warn('Error loading messages in profile popup:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSendingMessage(true);
    setMessageAlert(null);

    try {
      const sName = user?.name || senderNameInput.trim() || 'عميل متجر فهد';
      const sEmail = user?.email || senderEmailInput.trim() || 'guest@fahadstore.com';
      const sPhone = user?.phone || senderPhoneInput.trim() || '';

      const saved = await sendAndRetainCustomerMessage({
        senderName: sName,
        senderEmail: sEmail,
        phone: sPhone,
        subject: newSubject.trim() || 'استفسار من المتجر',
        message: newMessageText.trim(),
      });

      setMessages((prev) => [saved, ...prev.filter((m) => m.id !== saved.id)]);
      setNewSubject('');
      setNewMessageText('');
      setMessageAlert({
        type: 'success',
        text: 'تم إرسال وحفظ رسالتك بنجاح وسيتواصل معك فريق الدعم قريباً!',
      });
    } catch (err: any) {
      setMessageAlert({
        type: 'error',
        text: 'تعذر إرسال الرسالة حالياً، يرجى المحاولة لاحقاً',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteRetainedCustomerMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.warn('Delete message error:', err);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim() || !guestPass.trim() || !onLogin) return;
    await onLogin(guestEmail.trim(), guestPass);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPass.trim() || !onRegister) return;
    await onRegister({
      name: regName.trim() || 'عميل متجر فهد',
      email: regEmail.trim(),
      password: regPass,
      phone: regPhone.trim(),
      residenceCountry: regCountry.trim(),
      currentCity: regCity.trim(),
      detailedAddress: regAddress.trim(),
    });
  };

  const points = user?.loyaltyPoints ?? 50;
  const cashDiscount = (points * 0.1).toFixed(1);
  const pointsHistory = user?.email ? getPointsHistory(user.email) : [];

  // If Minimized, render as a sleek floating top badge
  if (isMinimized) {
    return (
      <div className="fixed top-3 right-3 sm:right-6 z-50 animate-in slide-in-from-top-3 duration-200">
        <div className="bg-slate-900/95 text-white border border-amber-400/40 rounded-2xl shadow-2xl p-2 sm:px-3.5 sm:py-2 flex items-center gap-2.5 backdrop-blur-md">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-2xs">
            {user?.name ? user.name[0] : 'ف'}
          </div>
          <div className="text-right cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 font-['Tajawal']">
                {user ? (user.name || user.email) : 'الملف الشخصي والرسائل'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                {user ? `${points} نقطة` : 'زائر'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">انقر لفتح الملف الشخصي</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="تكبير"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-4 px-2 sm:px-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-top-3 duration-250">
        {/* 1. Modal Top Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400 font-bold text-sm font-['Tajawal']">
                {user?.name ? user.name[0] : 'ف'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white font-['Tajawal']">
                  الملف الشخصي والخدمات • متجر فهد
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {user ? 'عميل مسجل' : 'حساب زائر'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                الملف الشخصي • الرسائل واستفسارات المتجر • آخر التحديثات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="تصغير النافذة لشريط عائم"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/80 transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Room Tabs Navigation */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-2 sm:px-4 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 py-1.5">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>ملفي ومكافآتي</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'messages'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>الرسائل والاستفسارات</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono">
                  {messages.length}
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>حساب جديد (50 نقطة)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'messages'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>الرسائل والاستفسارات</span>
              </button>
            </>
          )}

          {/* Updates Tab - Always Available */}
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'updates'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>آخر التحديثات</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </button>
        </div>

        {/* Global Auth Messages */}
        {authError && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{authError.text}</span>
            </div>
            {onClearMessages && (
              <button onClick={onClearMessages} className="text-rose-400 hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {authSuccess && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{authSuccess}</span>
            </div>
            {onClearMessages && (
              <button onClick={onClearMessages} className="text-emerald-400 hover:text-emerald-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 3. Room Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 text-right space-y-4">
          {/* TAB 1: User Profile & Points (Logged in) */}
          {user && activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>عضوية متجر فهد المميزة</span>
                  </span>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-400">نقاط الولاء</div>
                    <div className="text-lg font-black text-amber-400 font-mono">{points} نقطة</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black font-['Tajawal'] text-slate-100">{user.name}</h4>
                  <p className="text-xs text-slate-300 font-mono" dir="ltr">{user.email}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone || 'غير مسجل'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.residenceCountry || 'جمهورية مصر العربية'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.currentCity || 'القاهرة'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{user.detailedAddress || 'العنوان التفصيلي محفوظ'}</span>
                  </div>
                </div>
              </div>

              {/* Rewards Box */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>رصيد الخصم المالي المتاح</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    يمكنك خصم {cashDiscount} ج.م فوراً عند إتمام عملية الشراء من السلة.
                  </p>
                </div>
                <div className="font-black text-sm text-amber-900 font-mono px-3 py-1 bg-white rounded-xl border border-amber-200">
                  {cashDiscount} ج.م
                </div>
              </div>
            </div>
          )}

          {/* TAB: Guest Login */}
          {!user && activeTab === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-right space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-['Tajawal']">
                  تسجيل الدخول إلى حسابك في متجر فهد
                </h4>
                <p className="text-xs text-slate-500">
                  سجل دخولك للوصول لنقاط مكافآتك والاحتفاظ برسائلك وعنوانك سحابياً.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={guestPass}
                    onChange={(e) => setGuestPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAuth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                  <span>{loadingAuth ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
                </button>
              </form>

              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  إنشاء حساب جديد والحصول على 50 نقطة
                </button>
              </div>
            </div>
          )}

          {/* TAB: Guest Register */}
          {!user && activeTab === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-right space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-['Tajawal'] flex items-center gap-1.5">
                  <span>إنشاء حساب جديد في متجر فهد</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    + 50 نقطة هدية
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  جميع بياناتك (الإقامة، المدينة، والعنوان) تحفظ سحابياً لتسهيل التوصيل والشحن.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="فهد محمد"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="fahad@example.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                    <input
                      type="password"
                      required
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رقم الجوال للتوصيل</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">بلد الإقامة</label>
                    <input
                      type="text"
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      placeholder="جمهورية مصر العربية"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المدينة الحالية</label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="القاهرة، الإسكندرية، الجيزة..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">العنوان التفصيلي (الشارع، رقم العمارة، الشقة)</label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="شارع التحرير، الدقي، عمارة 15"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-rose-500/10 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAuth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{loadingAuth ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وحفظ بيانات التوصيل'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Messages Retention (الرسائل واستفسارات المتجر) */}
          {activeTab === 'messages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Send Message Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>خدمة عملاء مباشرة</span>
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 font-['Tajawal']">
                    إرسال استفسار أو رسالة جديدة
                  </h4>
                </div>

                {messageAlert && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      messageAlert.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {messageAlert.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{messageAlert.text}</span>
                  </div>
                )}

                <form onSubmit={handleSendNewMessage} className="space-y-2.5">
                  {!user && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="اسمك الكريم"
                        value={senderNameInput}
                        onChange={(e) => setSenderNameInput(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                      <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={senderEmailInput}
                        onChange={(e) => setSenderEmailInput(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                      <input
                        type="tel"
                        placeholder="رقم الهاتف"
                        value={senderPhoneInput}
                        onChange={(e) => setSenderPhoneInput(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="موضوع الرسالة أو الاستفسار (مثال: استفسار عن مقاس جاكيت)..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />

                  <textarea
                    rows={2}
                    required
                    placeholder="اكتب استفسارك هنا، وسيقوم فريق خدمة عملاء متجر فهد بمتابعة طلبك..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessageText.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{sendingMessage ? 'جاري الإرسال...' : 'إرسال الاستفسار الآن'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Messages History List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={loadMessages}
                    className="text-rose-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingMessages ? 'animate-spin' : ''}`} />
                    <span>تحديث القائمة</span>
                  </button>
                  <span className="font-bold text-slate-700">سجل الرسائل والاستفسارات ({messages.length})</span>
                </div>

                {loadingMessages ? (
                  <div className="text-center py-6 text-xs text-slate-400">جاري تحميل الرسائل...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
                    لا توجد رسائل محفوظة حتى الآن. أرسل أول استفسار لك أعلاه!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 transition-all hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-xs">{msg.subject}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(msg.date).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-2 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Latest Updates We Made (سجل التحديثات والإنجازات) */}
          {activeTab === 'updates' && (
            <div className="space-y-3 animate-in fade-in duration-200 text-right">
              <div className="p-3 bg-gradient-to-r from-indigo-50 via-rose-50 to-amber-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>سجل التحديثات الشاملة لمتجر فهد (Latest Updates)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تم جمع كافة التحديثات والرسائل والملف الشخصي في هذه النافذة لتوفير تجربة تصفح نقية ومثالية على شاشات الموبايل والحواسيب.
                </p>
              </div>

              {/* Updates List */}
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      التحديث الأحدث
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-['Tajawal']">
                      1. الترويسة الميسرة والملف الشخصي المدمج
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    تمكين زر اللوجو للعودة المباشرة للصفحة الرئيسية، وزر السلة مع عدد القطع، وزر الملف الشخصي والرسائل مع تصغير سلس.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      مفعل وشغال
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-['Tajawal']">
                      2. أسلوب العرض 4*4 للفئات وصفحات مخصصة
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    عرض 4 منتجات في مربع متناسق ومتجاوب (2x2) على شاشة الموبايل لكل فئة، مع صفحات مخصصة لكل فئة والتنقل السلس بينها.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      حفظ مستمر
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-['Tajawal']">
                      3. استبقاء الرسائل وتوثيق الاستفسارات
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    الاحتفاظ التلقائي بجميع رسائل واستفسارات العملاء على مدار الساعة مع التواريخ والموضوعات لخدمة سريعة.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      مكافآت
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-['Tajawal']">
                      4. مكافأة 50 نقطة ترحيبية وخصم مالي بالجنيه المصري
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    منح 50 نقطة تلقائياً عند التسجيل قابلة للتحويل إلى خصم فوري عند السداد في سلة المشتريات.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer */}
        <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
            >
              تسجيل الخروج
            </button>
          ) : (
            <span className="text-slate-500 text-[11px]">متجر فهد للأزياء • تسوق آمن وممتع</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              تصغير
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              متابعة التسوق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
