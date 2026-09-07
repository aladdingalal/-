import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  MapPin,
  Phone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Edit3,
  Check,
} from 'lucide-react';
import type { CartItem, UserProfile, CustomerOrder } from '../types';
import { addLoyaltyPoints, createCustomerOrder } from '../services/appwrite';
import {
  getWhatsAppOrderUrl,
  type WhatsAppOrderDetails,
} from '../config/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  user: UserProfile | null;
  onOpenAuthBar: () => void;
  onPointsUpdated?: () => void;
  onViewOrdersInProfile?: () => void;
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

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  user,
  onOpenAuthBar,
  onPointsUpdated,
  onViewOrdersInProfile,
}) => {
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedPointsThisOrder, setEarnedPointsThisOrder] = useState<number>(0);
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);
  const [whatsappSentUrl, setWhatsappSentUrl] = useState<string>('');

  // Delivery fields
  const [deliveryName, setDeliveryName] = useState(user?.name || '');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryCity, setDeliveryCity] = useState(user?.currentCity || 'القاهرة');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.detailedAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Sync with user data if user logs in
  useEffect(() => {
    if (user) {
      if (user.name && !deliveryName) setDeliveryName(user.name);
      if (user.phone && !deliveryPhone) setDeliveryPhone(user.phone);
      if (user.currentCity && deliveryCity === 'القاهرة') setDeliveryCity(user.currentCity);
      if (user.detailedAddress && !deliveryAddress) setDeliveryAddress(user.detailedAddress);
    }
  }, [user]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 500 || items.length === 0 ? 0 : 35;
  const total = subtotal + shipping;

  const handleWhatsAppCheckout = async () => {
    setValidationError(null);

    // Validate phone number
    const cleanPhone = deliveryPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setValidationError('يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد الشحن (مثال: 01012345678)');
      return;
    }

    // Validate address
    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      setValidationError('يرجى كتابة عنوان التوصيل بالتفصيل (اسم الشارع ورقم العمارة والشقة)');
      return;
    }

    setIsSubmitting(true);
    const earned = Math.max(10, Math.round(total * 0.1));
    setEarnedPointsThisOrder(earned);

    const customerName = deliveryName.trim() || user?.name || 'عميل متجر فهد';

    const orderDetails: WhatsAppOrderDetails = {
      customerName,
      phone: deliveryPhone.trim(),
      city: deliveryCity.trim() || 'القاهرة',
      address: deliveryAddress.trim(),
      notes: deliveryNotes.trim() || undefined,
      items: items.map((item) => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.selectedSize,
        color: item.selectedColor,
      })),
      subtotal,
      shipping,
      total,
    };

    const waUrl = getWhatsAppOrderUrl(orderDetails);
    setWhatsappSentUrl(waUrl);

    try {
      // Save order to store system
      const order = await createCustomerOrder({
        customerName,
        customerEmail: user?.email || `${cleanPhone}@fahadstore.com`,
        phone: deliveryPhone.trim(),
        city: deliveryCity.trim(),
        address: deliveryAddress.trim(),
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor,
          image: item.product.image,
        })),
        subtotal,
        shipping,
        total,
        pointsEarned: earned,
        notes: `طلب عبر واتساب${deliveryNotes ? ` - ملاحظات: ${deliveryNotes}` : ''}`,
      });

      setPlacedOrder(order);

      if (user?.email) {
        addLoyaltyPoints(
          user.email,
          earned,
          `شراء طلب أزياء وإكسسوارات بقيمة ${total} ج.م من متجر فهد`
        );
        if (onPointsUpdated) {
          onPointsUpdated();
        }
      }

      // Open WhatsApp directly
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        console.warn('Popup blocked, link shown in success view', e);
      }

      setOrderCompleted(true);
      onClearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      // Even if cloud save fails, open WhatsApp
      window.open(waUrl, '_blank');
      setOrderCompleted(true);
      onClearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-rose-50/70 to-emerald-50/70">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                سلة المشتريات
              </h3>
              <p className="text-xs text-slate-500">
                {items.length} {items.length === 1 ? 'منتج' : 'منتجات'} • إرسال فوري لواتساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orderCompleted ? (
            <div className="text-center py-8 px-2 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <MessageCircle className="w-10 h-10 text-[#25D366]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 font-['Tajawal']">
                  تم تجهيز طلبك للإرسال عبر واتساب!
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  تم إعداد تفاصيل المنتجات والعنوان لتأكيد طلبك وتحديد موعد الشحن مباشرة مع إدارة <strong className="text-slate-900">متجر فهد</strong>.
                </p>
              </div>

              {/* Direct WhatsApp Action Link */}
              {whatsappSentUrl && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 text-right">
                  <p className="text-xs text-emerald-950 font-bold text-center">
                    إذا لم تفتح محادثة واتساب تلقائياً، اضغط على الزر التالي فوراً:
                  </p>
                  <a
                    href={whatsappSentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>فتح محادثة واتساب الآن وإرسال الطلب</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Placed Order Details & Tracking */}
              {placedOrder && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-right text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-800">رقم الطلب المسجل:</span>
                    <span className="font-mono font-bold text-slate-700 dir-ltr">{placedOrder.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>إجمالي الطلب:</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">
                      {placedOrder.total} ج.م
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>وجهة التوصيل:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[200px]">
                      {placedOrder.city} - {placedOrder.address}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderCompleted(false);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  متابعة تصفح المتجر
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">سلة مشترياتك فارغة حالياً</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-20 rounded-xl object-cover bg-slate-200 shrink-0 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="font-bold text-xs text-slate-900 truncate" title={item.product.name}>
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {item.selectedSize && (
                        <span>المقاس: <strong className="text-slate-700">{item.selectedSize}</strong></span>
                      )}
                      {item.selectedColor && (
                        <>
                          <span>•</span>
                          <span>اللون: <strong className="text-slate-700">{item.selectedColor}</strong></span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-rose-600 text-xs font-['Tajawal'] font-mono">
                        {item.product.price * item.quantity} ج.م
                      </span>

                      {/* Quantity buttons */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 cursor-pointer font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-800 text-[11px]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 cursor-pointer font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="حذف المنتج"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Checkout Area */}
        {!orderCompleted && items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Delivery Data Section (Address & Phone for WhatsApp) */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بيانات التوصيل والتواصل:</span>
                </span>
                {user && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingAddress ? 'إخفاء' : 'تعديل'}</span>
                  </button>
                )}
              </div>

              {/* Editable Fields or View */}
              {(!user || isEditingAddress) ? (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">الاسم:</label>
                    <input
                      type="text"
                      value={deliveryName}
                      onChange={(e) => setDeliveryName(e.target.value)}
                      placeholder="اسم المستلم"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">رقم الهاتف (واتساب):</label>
                      <input
                        type="tel"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="01012345678"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">المحافظة:</label>
                      <select
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        {EGYPT_GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">العنوان التفصيلي:</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="اسم الشارع، رقم العمارة، رقم الشقة"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">ملاحظات إضافية (اختياري):</label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="مواعيد التوصيل المفضلة أو أي تفاصيل أخرى"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{deliveryName || user.name}</span>
                    <span className="font-bold text-emerald-600">{deliveryCity}</span>
                  </div>
                  <p className="text-slate-600 truncate">{deliveryAddress || 'العنوان المسجل'}</p>
                  <p className="text-slate-500 font-mono" dir="ltr">{deliveryPhone || user.phone}</p>
                </div>
              )}
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold">
                ⚠️ {validationError}
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-800 font-mono">{subtotal} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الشحن والتوصيل:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {shipping === 0 ? 'مجاناً (طلب أكثر من 500 ج.م)' : `${shipping} ج.م`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>المجموع المطلوب:</span>
                <span className="text-emerald-600 font-mono font-['Tajawal'] text-base font-black">
                  {total} ج.م
                </span>
              </div>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleWhatsAppCheckout}
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري فتح محادثة واتساب...</span>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                  <span>تأكيد وإرسال الطلب عبر واتساب ({total} ج.م)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400">
              سيتم فتح تطبيق واتساب فوراً مع كافة تفاصيل المنتجات والعنوان لتأكيد الشحن
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
