import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  Trash2,
  Reply,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  Check,
  Eye,
  Sliders,
  Bell,
  Truck,
  CheckCheck,
} from 'lucide-react';
import type {
  UserProfile,
  CustomerMessage,
  CustomerOrder,
  UserRegistrationData,
} from '../types';
import {
  getRetainedCustomerMessages,
  sendAndRetainCustomerMessage,
  deleteRetainedCustomerMessage,
  replyCustomerMessage,
  getCustomerOrders,
  updateCustomerOrderStatus,
  deleteCustomerOrder,
  getPointsHistory,
  ADMIN_EMAIL,
  isAdminEmail,
} from '../services/appwrite';

interface ProfilePageProps {
  user: UserProfile | null;
  onGoHome: () => void;
  onLogout: () => void;
  onLogin?: (email: string, pass: string) => Promise<void>;
  onRegister?: (data: UserRegistrationData) => Promise<void>;
  loadingAuth?: boolean;
  authError?: { text: string; hint?: string } | null;
  authSuccess?: string | null;
  initialTab?: 'orders' | 'messages' | 'profile' | 'wallet' | 'admin-orders' | 'admin-messages';
}

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

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>(
    initialTab || (isAdmin ? 'admin-orders' : user ? 'orders' : 'login')
  );

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<CustomerOrder | null>(null);

  // Messages State
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Send Message State (From Customer to Admin)
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSenderName, setMsgSenderName] = useState(user?.name || '');
  const [msgSenderEmail, setMsgSenderEmail] = useState(user?.email || '');
  const [msgSenderPhone, setMsgSenderPhone] = useState(user?.phone || '');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgAlert, setMsgAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Reply State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Guest login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Guest register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('المملكة العربية السعودية');
  const [regCity, setRegCity] = useState('الرياض');
  const [regAddress, setRegAddress] = useState('');

  // Sync state when user updates
  useEffect(() => {
    if (user) {
      setMsgSenderName(user.name || '');
      setMsgSenderEmail(user.email || '');
      setMsgSenderPhone(user.phone || '');
      if (isAdmin && activeTab === 'login') {
        setActiveTab('admin-orders');
      } else if (!isAdmin && activeTab === 'login') {
        setActiveTab('orders');
      }
    }
  }, [user]);

  // Load Orders & Messages
  const loadData = async () => {
    setLoadingOrders(true);
    setLoadingMessages(true);
    try {
      const emailParam = isAdmin ? undefined : user?.email;
      const [fetchedOrders, fetchedMsgs] = await Promise.all([
        getCustomerOrders(emailParam),
        getRetainedCustomerMessages(emailParam),
      ]);
      setOrders(fetchedOrders);
      setMessages(fetchedMsgs);
    } catch (err) {
      console.warn('Error fetching profile data:', err);
    } finally {
      setLoadingOrders(false);
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.email, isAdmin]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) {
      setMsgAlert({ type: 'error', text: 'يرجى كتابة نص الرسالة أو الاستفسار' });
      return;
    }
    setIsSendingMsg(true);
    setMsgAlert(null);

    try {
      const name = user?.name || msgSenderName.trim() || 'عميل المتجر';
      const email = user?.email || msgSenderEmail.trim() || 'customer@fahadstore.com';
      const phone = user?.phone || msgSenderPhone.trim() || '';

      const created = await sendAndRetainCustomerMessage({
        senderName: name,
        senderEmail: email,
        recipientEmail: ADMIN_EMAIL,
        phone,
        subject: msgSubject.trim() || 'استفسار عن المنتجات والطلبات',
        message: msgBody.trim(),
      });

      setMessages((prev) => [created, ...prev]);
      setMsgBody('');
      setMsgSubject('');
      setMsgAlert({
        type: 'success',
        text: 'تم إرسال رسالتك بنجاح وحفظها بحساب خدمة العملاء والإدارة، وسيتم الرد عليك قريباً.',
      });
    } catch (err: any) {
      setMsgAlert({ type: 'error', text: err.message || 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً' });
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Handle Admin Reply
  const handleSendReply = async (messageId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const updated = await replyCustomerMessage(messageId, replyText.trim());
      if (updated) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
        setReplyingToId(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Error replying:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Admin Order Status Change
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ) => {
    const updated = await updateCustomerOrderStatus(orderId, status);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(updated);
      }
    }
  };

  // Handle Delete Message
  const handleDeleteMsg = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    await deleteRetainedCustomerMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const loyaltyPoints = user?.loyaltyPoints || 150;
  const pointsHistory = user?.email ? getPointsHistory(user.email) : [];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16 font-sans">
      {/* 1. Header Bar with Back Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمتجر</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-sm font-bold text-slate-900 font-['Tajawal']">
              {isAdmin ? 'لوحة إدارة متجر فهد (الحساب الإداري)' : 'الملف الشخصي والحساب'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders || loadingMessages ? 'animate-spin' : ''}`} />
            </button>
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 2. Profile User Overview Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-rose-500/15">
                {user?.name ? user.name[0] : <User className="w-8 h-8" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Tajawal']">
                    {user?.name || 'زائر متجر فهد'}
                  </h2>
                  {isAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-rose-600 text-white text-[11px] font-bold shadow-xs">
                      إدارة المتجر المعتمدة
                    </span>
                  ) : user ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      حساب مفعل
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                      جلسة تصفح زائر
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {isAdmin
                    ? 'أنت مسجل كمدير النظام - يمكنك استعراض كافة طلبات العملاء والرد على استفساراتهم الواردة مباشرة'
                    : user
                    ? `${user.email} • عضو منذ ${new Date(user.registration || Date.now()).toLocaleDateString('ar-SA')}`
                    : 'سجل الدخول أو أنشئ حساباً للاحتفاظ بطلباتك ونقاط المكافآت وسجل المراسلات'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="flex-1 sm:flex-initial px-4 py-2 bg-rose-50/80 rounded-xl border border-rose-100 text-center">
                <span className="text-[11px] text-rose-700 font-bold block">
                  {isAdmin ? 'إجمالي الطلبات' : 'طلباتي'}
                </span>
                <span className="text-lg font-black text-rose-900 font-mono">
                  {orders.length}
                </span>
              </div>
              <div className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-50/80 rounded-xl border border-indigo-100 text-center">
                <span className="text-[11px] text-indigo-700 font-bold block">
                  {isAdmin ? 'الرسائل الواردة' : 'رسائلي'}
                </span>
                <span className="text-lg font-black text-indigo-900 font-mono">
                  {messages.length}
                </span>
              </div>
              {!isAdmin && (
                <div className="flex-1 sm:flex-initial px-4 py-2 bg-amber-50/80 rounded-xl border border-amber-100 text-center">
                  <span className="text-[11px] text-amber-700 font-bold block">نقاط الولاء</span>
                  <span className="text-lg font-black text-amber-900 font-mono">
                    {loyaltyPoints}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200 text-xs sm:text-sm font-bold scrollbar-none">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('admin-orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin-orders'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>طلبات العملاء الواردة ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin-messages')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin-messages'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>صندوق استفسارات العملاء ({messages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>بيانات الحساب</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>سجل طلباتي ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'messages'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>الرسائل والاستفسارات ({messages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>البيانات وعنوان التوصيل</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>محفظة المكافآت ({loyaltyPoints} نقطة)</span>
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* 4. Tab Contents */}

        {/* TAB A: Admin Orders Management (Exclusive to Admin) */}
        {activeTab === 'admin-orders' && isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                  إدارة طلبات العملاء المكتملة
                </h3>
                <p className="text-xs text-slate-500">
                  كافة الطلبات الواردة من عملاء وزوار المتجر مع تفاصيل الشحن والمنتجات
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                {orders.length} طلب إجمالي
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800">لا توجد طلبات واردة حالياً</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  عند قيام أي عميل بطلب منتجات من المتجر، ستظهر بيانات الطلب هنا فوراً لتجهيزها وشحنها.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold font-mono">
                          #{order.id.slice(-4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {order.customerName}
                            </h4>
                            <span className="text-xs font-mono text-slate-400">
                              ({order.customerEmail})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(order.date).toLocaleString('ar-SA')}</span>
                            {order.phone && <span>• هاتف: {order.phone}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status badge & selector */}
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(
                              order.id,
                              e.target.value as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                            )
                          }
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="processing">جاري التجهيز</option>
                          <option value="shipped">تم الشحن للتوصيل</option>
                          <option value="delivered">تم التسليم للعميل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </div>

                    {/* Destination and contact */}
                    <div className="bg-slate-50 p-3 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900">عنوان التوصيل: </span>
                        <span>{order.city} - {order.address || 'العنوان المسجل'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">نقاط المكافأة الممنوحة: </span>
                        <span className="text-amber-700 font-bold">+{order.pointsEarned || 0} نقطة</span>
                      </div>
                    </div>

                    {/* Ordered Items list */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">المنتجات المطلوبة:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 border border-slate-100"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-12 h-14 rounded-lg object-cover bg-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="flex-1 min-w-0 text-xs">
                              <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span>الكمية: {item.quantity}</span>
                                {item.size && <span>• مقاس: {item.size}</span>}
                                {item.color && <span>• لون: {item.color}</span>}
                              </div>
                              <p className="font-mono font-bold text-rose-600 text-[11px]">
                                {item.price * item.quantity} ريال
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order total footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <div className="space-x-2 space-x-reverse text-slate-500">
                        <span>المجموع الفرعي: {order.subtotal} ريال</span>
                        <span>•</span>
                        <span>الشحن: {order.shipping === 0 ? 'مجاني' : `${order.shipping} ريال`}</span>
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        الإجمالي: <span className="text-rose-600 font-mono text-base">{order.total} ريال</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB B: Admin Messages & Inquiries (Exclusive to Admin) */}
        {activeTab === 'admin-messages' && isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                  صندوق رسائل واستفسارات العملاء الواردة
                </h3>
                <p className="text-xs text-slate-500">
                  جميع رسائل واستفسارات عملاء المتجر مع إمكانية الرد الفوري المباشر من حساب الإدارة
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                {messages.length} رسالة
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800">صندوق الرسائل فارغ</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  أي استفسار يرسله عملاء المتجر سيصل إلى هنا مباشرة.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {msg.senderName ? msg.senderName[0] : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{msg.senderName}</span>
                            <span className="text-xs text-slate-400 font-mono">({msg.senderEmail})</span>
                            {msg.status === 'replied' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                تم الرد
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">
                                بانتظار الرد
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(msg.date).toLocaleString('ar-SA')}</span>
                            {msg.phone && <span>• هاتف: {msg.phone}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(replyingToId === msg.id ? null : msg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>{msg.reply ? 'تعديل الرد' : 'الرد على العميل'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMsg(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-slate-900">{msg.subject}</p>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {/* Existing reply display */}
                    {msg.reply && (
                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-indigo-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCheck className="w-4 h-4 text-indigo-600" />
                            <span>رد الإدارة المرسل للعميل:</span>
                          </span>
                          {msg.replyDate && (
                            <span className="text-[10px] text-indigo-600 font-normal">
                              {new Date(msg.replyDate).toLocaleString('ar-SA')}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.reply}</p>
                      </div>
                    )}

                    {/* Reply Form if opened */}
                    {replyingToId === msg.id && (
                      <div className="p-3.5 bg-slate-100/80 rounded-xl space-y-2 border border-slate-200">
                        <label className="block text-xs font-bold text-slate-800">
                          كتابة رد إلى العميل ({msg.senderName}):
                        </label>
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="اكتب رد إدارة المتجر هنا وسوف يظهر للعميل في حسابه مباشرة..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingReply || !replyText.trim()}
                            onClick={() => handleSendReply(msg.id)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSubmittingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB C: Customer Orders (Normal Customer View) */}
        {activeTab === 'orders' && !isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                  سجل طلباتي ومتابعة الشحنات
                </h3>
                <p className="text-xs text-slate-500">
                  متابعة حالة شحن طلبات الأزياء والإكسسوارات المعتمدة في متجر فهد
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                {orders.length} طلب
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">لا توجد طلبات مسجلة بعد</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  تصفح تشكيلات الملابس والإكسسوارات في متجر فهد وأضف ما يعجبك إلى السلة لإتمام أول طلب والاستفادة من نقاط المكافآت.
                </p>
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:opacity-95"
                >
                  تسوق المنتجات الآن
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold font-mono shadow-xs">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              طلب رقم: <span className="font-mono text-rose-600">#{order.id.slice(-6)}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(order.date).toLocaleDateString('ar-SA')}</span>
                            <span>• {order.items.length} منتج</span>
                          </p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {order.status === 'delivered' ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم التوصيل بنجاح
                          </span>
                        ) : order.status === 'shipped' ? (
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold text-xs flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            جاري التوصيل لعنوانك
                          </span>
                        ) : order.status === 'cancelled' ? (
                          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-xs">
                            تم الإلغاء
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            قيد التجهيز من الإدارة
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ordered items preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 bg-slate-50/90 rounded-xl border border-slate-100"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-12 h-14 rounded-lg object-cover bg-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              الكمية: {item.quantity} {item.size && `• مقاس ${item.size}`} {item.color && `• ${item.color}`}
                            </p>
                            <p className="font-mono font-bold text-rose-600 text-xs">
                              {item.price * item.quantity} ريال
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Destination & points summary */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>وجهة الشحن: {order.city} - {order.address}</span>
                      </div>
                      <div className="flex items-center gap-3 font-bold">
                        <span className="text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          +{order.pointsEarned || 0} نقطة مكافأة
                        </span>
                        <span className="text-slate-900 font-mono text-base">
                          الإجمالي: {order.total} ريال
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB D: Customer Messages & Contact (Account to Account) */}
        {activeTab === 'messages' && !isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main: Messages thread */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                    محادثاتي مع إدارة المتجر
                  </h3>
                  <p className="text-xs text-slate-500">
                    تواصل مباشر وآمن بين حسابك وحساب إدارة المتجر
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  {messages.length} رسالة
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">لا توجد رسائل سابقة</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    يمكنك كتابة أي استفسار أو طلب خاص عبر النموذج الجانبي وسيصل مباشرة لإدارة المتجر المعتمدة.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{msg.subject}</span>
                            {msg.reply ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                تم الرد من الإدارة
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">
                                تم الاستلام
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(msg.date).toLocaleString('ar-SA')}</span>
                            <span>• المستلم: إدارة متجر فهد (فريق المبيعات والدعم)</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMsg(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Customer's original message */}
                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      {/* Store Admin's Reply */}
                      {msg.reply ? (
                        <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-indigo-900 font-bold">
                            <span className="flex items-center gap-1.5">
                              <CheckCheck className="w-4 h-4 text-indigo-600" />
                              <span>رد إدارة متجر فهد:</span>
                            </span>
                            {msg.replyDate && (
                              <span className="text-[10px] text-indigo-600 font-normal">
                                {new Date(msg.replyDate).toLocaleString('ar-SA')}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.reply}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>تم إرسال الرسالة إلى إدارة المتجر وهي قيد المراجعة حالياً.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: New Message Form */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs h-fit space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-['Tajawal'] flex items-center gap-2">
                  <Send className="w-4 h-4 text-rose-600" />
                  <span>إرسال رسالة أو استفسار للإدارة</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  يتم إرسال الرسالة مباشرة من حسابك إلى حساب إدارة المتجر
                </p>
              </div>

              {msgAlert && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    msgAlert.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {msgAlert.text}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-3">
                {!user && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكريم:</label>
                      <input
                        type="text"
                        required
                        value={msgSenderName}
                        onChange={(e) => setMsgSenderName(e.target.value)}
                        placeholder="مثال: فهد السالم"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                      <input
                        type="email"
                        required
                        value={msgSenderEmail}
                        onChange={(e) => setMsgSenderEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
                        dir="ltr"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">موضوع الرسالة:</label>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)}
                    placeholder="استفسار عن مقاس / حالة طلب / اقتراح"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص الاستفسار:</label>
                  <textarea
                    rows={4}
                    required
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="اكتب استفسارك أو تفاصيل طلبك بالتفصيل هنا..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white leading-relaxed"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1 text-slate-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>حماية الخصوصية وموثوقية الرسائل:</span>
                  </div>
                  <p>ترسل الرسائل مباشرة وبصورة مشفرة لحساب إدارة المتجر مع حفظ سجل كامل في حسابك.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingMsg}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingMsg ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الرسالة إلى إدارة المتجر</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB E: Personal Information & Delivery Address */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                البيانات الشخصية وعنوان الشحن
              </h3>
              <p className="text-xs text-slate-500">
                تُستخدم هذه البيانات لتجهيز شحناتك وتوصيل المنتجات إلى باب منزلك تلقائياً
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium block">الاسم الكامل</span>
                <span className="font-bold text-slate-900 text-sm">{user?.name || 'غير مسجل'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium block">البريد الإلكتروني</span>
                <span className="font-bold text-slate-900 text-sm font-mono dir-ltr">{user?.email || 'غير مسجل'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium block">رقم الجوال</span>
                <span className="font-bold text-slate-900 text-sm font-mono dir-ltr">
                  {user?.phone || '+966 5X XXX XXXX'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium block">المدينة والدولة</span>
                <span className="font-bold text-slate-900 text-sm">
                  {user?.currentCity || 'الرياض'} - {user?.residenceCountry || 'المملكة العربية السعودية'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <span className="text-slate-400 font-medium block">العنوان التفصيلي للتوصيل</span>
              <p className="font-bold text-slate-800 text-sm">
                {user?.detailedAddress || 'حي النرجس، شارع عثمان بن عفان، الرياض'}
              </p>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>حسابك مؤمن في متجر فهد:</span>
              </div>
              <p className="text-[11px] text-slate-600">
                يتم حفظ كافة تفاصيل حسابك سحابياً وبشكل مشفر لضمان تجربة تسوق سلسة واستلام فوري لكافة التحديثات.
              </p>
            </div>
          </div>
        )}

        {/* TAB F: Loyalty Wallet & Points */}
        {activeTab === 'wallet' && !isAdmin && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-2xl p-6 sm:p-8 text-slate-950 shadow-lg shadow-amber-500/15 relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-slate-950" />
                    <h3 className="text-xl font-black font-['Tajawal']">محفظة نقاط الولاء والمكافآت</h3>
                  </div>
                  <p className="text-xs text-slate-800 max-w-sm">
                    اكسب 10% من قيمة كل طلب أزياء كـ نقاط ولاء واستبدلها بخصومات مباشرة على مشترياتك القادمة.
                  </p>
                </div>
                <div className="px-6 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm text-center">
                  <span className="text-[11px] text-slate-600 font-bold block">رصيد النقاط المتاح</span>
                  <span className="text-3xl font-black text-amber-900 font-mono">{loyaltyPoints}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                    = خصم {Math.floor(loyaltyPoints / 10)} ريال
                  </span>
                </div>
              </div>
            </div>

            {/* Points history */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 font-['Tajawal']">سجل حركات النقاط</h4>
              {pointsHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  لا توجد حركات سابقة للنقاط
                </div>
              ) : (
                <div className="space-y-2">
                  {pointsHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{rec.reason}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rec.date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-emerald-600 text-sm">
                        +{rec.points} نقطة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB G: Login / Register if not logged in */}
        {activeTab === 'login' && !user && (
          <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 font-['Tajawal']">
                تسجيل الدخول إلى حسابك
              </h3>
              <p className="text-xs text-slate-500">
                سجل الدخول لحفظ سلة مشترياتك ومتابعة كافة الطلبات ومراسلات الإدارة
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs space-y-1">
                <p className="font-bold">{authError.text}</p>
                {authError.hint && <p className="text-[11px] text-red-600">{authError.hint}</p>}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                {authSuccess}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onLogin) {
                  await onLogin(loginEmail, loginPassword);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="example@fahadstore.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {loadingAuth ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
