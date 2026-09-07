import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Clock,
  User,
  Mail,
  Phone,
  Cloud,
  ShieldCheck,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import type { CustomerMessage, UserProfile } from '../types';
import {
  sendAndRetainCustomerMessage,
  getRetainedCustomerMessages,
  deleteRetainedCustomerMessage,
} from '../services/appwrite';

interface CustomerMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const CustomerMessagesModal: React.FC<CustomerMessagesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  // Form fields
  const [senderName, setSenderName] = useState(currentUser?.name || '');
  const [senderEmail, setSenderEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync user details if user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setSenderName(currentUser.name);
      if (currentUser.email) setSenderEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Load messages on open or tab change
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const list = await getRetainedCustomerMessages();
      setMessages(list);
    } catch (err) {
      console.warn('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !senderName.trim()) {
      setNotification({
        type: 'error',
        text: 'يرجى كتابة اسمك ونص الرسالة لإرسالها وحفظها في السحابة',
      });
      return;
    }

    setSending(true);
    setNotification(null);

    try {
      const saved = await sendAndRetainCustomerMessage({
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim() || 'customer@fahadstore.com',
        phone: phone.trim() || undefined,
        subject: subject.trim() || 'استفسار من متجر فهد',
        message: messageText.trim(),
      });

      setMessages((prev) => [saved, ...prev.filter((m) => m.id !== saved.id)]);
      setMessageText('');
      setSubject('');
      setNotification({
        type: 'success',
        text: 'تم إرسال الرسالة والاحتفاظ بها سحابياً بنجاح عبر المفتاح السحابي!',
      });
      setActiveTab('history');
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: 'حدث خطأ أثناء حفظ الرسالة في السحابة. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRetainedCustomerMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-['Tajawal']">صندوق الرسائل السحابي</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>مفعل بالمفتاح السحابي</span>
                </span>
              </div>
              <p className="text-xs text-white/80">
                إرسال واستقبال الرسائل والاحتفاظ بها دائماً في سحابة متجر فهد (FAHAD)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Status Info Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/70 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs">
              المفتاح السحابي متصل بنجاح: يتم الاحتفاظ بكافة الرسائل في مخزن سحابة Appwrite
            </span>
          </div>
          <button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-bold cursor-pointer"
            title="تحديث الرسائل"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-3 gap-2 text-xs font-bold font-['Tajawal']">
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compose'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال رسالة جديدة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>الرسائل المحفوظة بالسحابة</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-700">
              {messages.length}
            </span>
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'compose' ? (
            /* Compose Tab */
            <form onSubmit={handleSendMessage} className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sender Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-end">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>الاسم الكريم *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="مثال: فهد القحطاني"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all"
                  />
                </div>

                {/* Sender Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-end">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>البريد الإلكتروني</span>
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Phone & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-end">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>رقم الهاتف بمصر (اختياري)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-end">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>موضوع الرسالة</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: استفسار عن مقاس فستان أو شحن إكسسوارات"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-end">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>نص الرسالة والاستفسار *</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="اكتب رسالتك أو استفسارك هنا، وسيتم حفظها بشكل دائم في سحابة متجر فهد والرد عليك فوراً..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ في السحابة بالمفتاح...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال وحفظ في سحابة فهد</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span>جاري تحميل الرسائل المحفوظة في سحابة Appwrite...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-600">لا توجد رسائل محفوظة بعد</p>
                  <p className="text-[11px]">
                    يمكنك إرسال أول رسالة لتخزينها في السحابة عبر المفتاح السحابي.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl transition-all shadow-2xs space-y-2 text-right"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف الرسالة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-['Tajawal']">
                            {msg.subject || 'استفسار عام'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                            <Cloud className="w-2.5 h-2.5" />
                            <span>محفوظة سحابياً</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          {msg.senderEmail && <span>• {msg.senderEmail}</span>}
                          {msg.phone && <span>• {msg.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="font-mono text-slate-400 text-[9px]">{msg.id}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(msg.date).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-6">
          <span>متجر فهد للأزياء | FAHAD Fashion Store</span>
          <span className="font-mono text-slate-400">Appwrite Cloud Storage & Messaging</span>
        </div>
      </div>
    </div>
  );
};
