import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  Trash2,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import type {
  UserProfile,
  CustomerOrder,
  UserRegistrationData,
} from '../types';
import {
  getCustomerOrders,
  updateCustomerOrderStatus,
  deleteCustomerOrder,
  saveUserProfileMeta,
  isAdminEmail,
} from '../services/appwrite';

interface ProfilePageProps {
  user: UserProfile | null;
  onGoHome: () => void;
  onLogout: () => void;
  onLogin?: (emailOrPhone: string, pass: string) => Promise<void>;
  onRegister?: (data: UserRegistrationData) => Promise<void>;
  loadingAuth?: boolean;
  authError?: { text: string; hint?: string } | null;
  authSuccess?: string | null;
  initialTab?: 'orders' | 'profile' | 'admin-orders' | 'login' | 'register';
}

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية (المنصورة)',
  'الغربية (طنطا)',
  'الشرقية (الزقازيق)',
  'المنوفية (شبين الكوم)',
  'البحيرة (دمنهور)',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر (الغردقة)',
  'جنوب سيناء (شرم الشيخ)',
  'شمال سيناء',
  'مطروح',
  'الوادي الجديد',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onGoHome,
  onLogout,
  onLogin,
  onRegister,
  loadingAuth = false,
  authError = null,
  authSuccess = null,
  initialTab,
}) => {
  const isAdmin = user ? isAdminEmail(user.email) : false;

  // Mode for unauthenticated users: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    initialTab === 'login' ? 'login' : 'register'
  );

  // Authenticated tab: 'profile' | 'orders' | 'admin-orders'
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'admin-orders'>(
    isAdmin ? 'admin-orders' : 'profile'
  );

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('القاهرة');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // Edit profile state (for logged in users)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCity, setEditCity] = useState(user?.currentCity || 'القاهرة');
  const [editAddress, setEditAddress] = useState(user?.detailedAddress || '');
  const [profileSaveMsg, setProfileSaveMsg] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    if (initialTab === 'login' || initialTab === 'register') {
      setAuthMode(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditCity(user.currentCity || 'القاهرة');
      setEditAddress(user.detailedAddress || '');
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const all = await getCustomerOrders();
      if (isAdmin) {
        setOrders(all);
      } else {
        const myOrders = all.filter(
          (o) =>
            o.customerEmail.toLowerCase() === user.email.toLowerCase() ||
            (user.phone && o.phone && o.phone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''))
        );
        setOrders(myOrders);
      }
    } catch (err) {
      console.warn('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    saveUserProfileMeta(user.email, {
      name: editName.trim(),
      phone: editPhone.trim(),
      currentCity: editCity.trim(),
      detailedAddress: editAddress.trim(),
    });

    user.name = editName.trim();
    user.phone = editPhone.trim();
    user.currentCity = editCity.trim();
    user.detailedAddress = editAddress.trim();

    setIsEditingProfile(false);
    setProfileSaveMsg('تم حفظ وتحديث بياناتك وعنوانك بنجاح');
    setTimeout(() => setProfileSaveMsg(null), 3000);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ) => {
    try {
      await updateCustomerOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟')) return;
    try {
      await deleteCustomerOrder(orderId);
      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================================
  // VIEW 1: NORMAL LOGIN & REGISTRATION PAGE (WHEN NOT LOGGED IN)
  // Clean, focused, no extraneous tabs or cluttered stats
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-[85vh] flex flex-col justify-center py-8 px-4 sm:px-6">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Back to store navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للمتجر</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">متجر فهد (FAHAD)</span>
          </div>

          {/* Clean Authentication Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center mx-auto shadow-xs">
                {authMode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Tajawal']">
                {authMode === 'login' ? 'تسجيل الدخول' : 'تسجيل أول مرة (حساب جديد)'}
              </h2>
              <p className="text-xs text-slate-500">
                {authMode === 'login'
                  ? 'أدخل رقم هاتفك أو بريدك الإلكتروني للدخول'
                  : 'سجل بياناتك وعنوان التوصيل ورقم هاتفك للطلب السريع'}
              </p>
            </div>

            {/* Switch Tabs: Normal & Simple */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                تسجيل أول مرة
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs space-y-1 text-right">
                <p className="font-bold">{authError.text}</p>
                {authError.hint && <p className="text-[11px] text-red-600">{authError.hint}</p>}
              </div>
            )}

            {/* Success Message */}
            {authSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-right">
                {authSuccess}
              </div>
            )}

            {/* TAB 1: NORMAL LOGIN FORM */}
            {authMode === 'login' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (onLogin) {
                    await onLogin(loginIdentifier, loginPassword);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    رقم الهاتف أو البريد الإلكتروني:
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="01012345678 أو example@email.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingAuth ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{loadingAuth ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}</span>
                </button>

                <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                  ليس لديك حساب بعد؟{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    تسجيل حساب لأول مرة
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: NORMAL FIRST-TIME REGISTRATION WITH PHONE & ADDRESS */}
            {authMode === 'register' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (onRegister) {
                    const cleanPhone = regPhone.trim();
                    const derivedEmail = regEmail.trim() || `${cleanPhone.replace(/\D/g, '') || 'customer'}@fahadstore.com`;
                    await onRegister({
                      name: regName.trim() || 'عميل متجر فهد',
                      email: derivedEmail,
                      password: regPassword,
                      phone: cleanPhone,
                      residenceCountry: 'جمهورية مصر العربية',
                      currentCity: regCity.trim() || 'القاهرة',
                      detailedAddress: regAddress.trim(),
                    });
                  }
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالكامل:</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم التليفون للتواصل والتوصيل (مصر):</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المحافظة:</label>
                  <select
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-bold text-xs"
                  >
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل:</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="اسم الشارع، رقم العمارة، رقم الشقة أو علامة مميزة"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="6 أحرف أو أرقام على الأقل"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    البريد الإلكتروني <span className="text-[10px] font-normal text-slate-400">(اختياري):</span>
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="customer@example.com (اختياري)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    dir="ltr"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>يتم حفظ عنوانك ورقم هاتفك لسرعة التوصيل وطلب المنتجات مباشرة عبر واتساب.</span>
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingAuth ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{loadingAuth ? 'جاري إنشاء الحساب...' : 'تسجيل حساب جديد'}</span>
                </button>

                <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED-IN VIEW (CLEAN PROFILE, ADDRESS & ORDERS ONLY)
  // No extraneous tabs
  // =========================================================================
  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center text-xl font-bold shadow-xs">
            {user.name ? user.name[0] : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 font-['Tajawal']">
                {user.name || 'عميل المتجر'}
              </h2>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                  إدارة المتجر
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  حساب مسجل
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              {user.phone && <span>الهاتف: <strong className="text-slate-700" dir="ltr">{user.phone}</strong></span>}
              {user.currentCity && <span>• المحافظة: <strong className="text-slate-700">{user.currentCity}</strong></span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={onGoHome}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-center"
          >
            تصفح المنتجات
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {profileSaveMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{profileSaveMsg}</span>
        </div>
      )}

      {/* Simple Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('admin-orders')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin-orders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              طلبات العملاء الواردة ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              بيانات الحساب
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              العنوان والبيانات الشخصية
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              سجل طلباتي ({orders.length})
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT: PROFILE & ADDRESS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                عنوان التوصيل والبيانات الشخصية
              </h3>
              <p className="text-xs text-slate-500">
                العنوان المعتمد لشحن المنتجات وتأكيد طلباتك عبر واتساب
              </p>
            </div>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-indigo-600 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل العنوان</span>
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfileEdits} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم التليفون (مصر):</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المحافظة:</label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدولة:</label>
                  <input
                    type="text"
                    value="جمهورية مصر العربية"
                    readOnly
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان التفصيلي للتوصيل:</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="اسم الشارع، رقم العمارة، رقم الشقة"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">الاسم الكامل</span>
                <p className="font-bold text-slate-900 text-sm">{user.name || 'غير مسجل'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">رقم الهاتف للتوصيل</span>
                <p className="font-bold text-slate-900 text-sm font-mono" dir="ltr">
                  {user.phone || 'غير مسجل'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">المحافظة والمدينة</span>
                <p className="font-bold text-slate-900 text-sm">
                  {user.currentCity || 'القاهرة'} - مصر
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">العنوان التفصيلي</span>
                <p className="font-bold text-slate-900 text-sm">
                  {user.detailedAddress || 'لم يُسجل بعد'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CUSTOMER ORDERS */}
      {activeTab === 'orders' && !isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
              سجل طلباتي
            </h3>
            <button
              type="button"
              onClick={loadOrders}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>تحديث الطلبات</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">لا توجد طلبات سابقة مسجلة بحسابك حتى الآن</p>
              <button
                type="button"
                onClick={onGoHome}
                className="text-xs font-bold text-slate-900 underline cursor-pointer"
              >
                تصفح المنتجات وأضف طلبك الأول
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="font-bold text-slate-800 block">طلب رقم: {ord.id}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.date).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'processing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {ord.status === 'delivered'
                        ? 'تم التسليم'
                        : ord.status === 'shipped'
                        ? 'تم الشحن'
                        : ord.status === 'processing'
                        ? 'قيد التجهيز'
                        : 'طلب جديد عبر واتساب'}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="space-y-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <span>
                          {it.quantity} × {it.productName}
                          {it.size ? ` (${it.size})` : ''}
                        </span>
                        <span className="font-mono font-bold">{it.price * it.quantity} ج.م</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-bold">
                    <span className="text-slate-600">الإجمالي المطلوب:</span>
                    <span className="text-sm font-mono text-emerald-600 font-black">
                      {ord.total} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADMIN ORDERS MANAGEMENT */}
      {activeTab === 'admin-orders' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
              طلبات العملاء الواردة ({orders.length})
            </h3>
            <button
              type="button"
              onClick={loadOrders}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>تحديث القائمة</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              لا توجد طلبات جديدة واردة حالياً
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{ord.customerName}</span>
                        <span className="font-mono text-slate-400 text-[11px]">#{ord.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span dir="ltr">{ord.phone || 'بدون هاتف'}</span>
                        <span>•</span>
                        <span>{ord.city} - {ord.address}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.phone && (
                        <a
                          href={`https://wa.me/${ord.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="محادثة العميل عبر واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="حذف الطلب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <span>
                          {it.quantity} × {it.productName}
                          {it.size ? ` [مقاس: ${it.size}]` : ''}
                          {it.color ? ` [لون: ${it.color}]` : ''}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {it.price * it.quantity} ج.م
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 font-bold">
                      <span>إجمالي الحساب:</span>
                      <span className="text-emerald-600 font-mono text-sm">{ord.total} ج.م</span>
                    </div>
                  </div>

                  {/* Order Status Control */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-slate-500 font-bold ml-2">تحديث الحالة:</span>
                    {(['pending', 'processing', 'shipped', 'delivered'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateOrderStatus(ord.id, st)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          ord.status === st
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'pending'
                          ? 'طلب جديد'
                          : st === 'processing'
                          ? 'قيد التجهيز'
                          : st === 'shipped'
                          ? 'تم الشحن'
                          : 'تم التسليم'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
