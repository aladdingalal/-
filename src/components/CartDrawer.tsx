import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  MapPin,
  Phone,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Award,
} from 'lucide-react';
import type { CartItem, UserProfile, CustomerOrder } from '../types';
import { addLoyaltyPoints, createCustomerOrder } from '../services/appwrite';

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

  // Guest delivery info if not logged in
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCity, setGuestCity] = useState('الرياض');
  const [guestAddress, setGuestAddress] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 200 || items.length === 0 ? 0 : 25;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    setIsSubmitting(true);
    const earned = Math.max(10, Math.round(total * 0.1));
    setEarnedPointsThisOrder(earned);

    try {
      const order = await createCustomerOrder({
        customerName: user?.name || guestName || 'عميل المتجر',
        customerEmail: user?.email || (guestPhone ? `${guestPhone}@fahadstore.com` : 'customer@fahadstore.com'),
        phone: user?.phone || guestPhone || '',
        city: user?.currentCity || guestCity || 'الرياض',
        address: user?.detailedAddress || guestAddress || 'حي النرجس، الرياض',
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
        notes: 'طلب تسوق إلكتروني من متجر فهد',
      });

      setPlacedOrder(order);

      if (user?.email) {
        addLoyaltyPoints(
          user.email,
          earned,
          `شراء طلب أزياء وإكسسوارات بقيمة ${total} ريال من متجر فهد`
        );
        if (onPointsUpdated) {
          onPointsUpdated();
        }
      }

      setOrderCompleted(true);
      onClearCart();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-rose-50/70 to-sky-50/70">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Tajawal']">
                سلة المشتريات
              </h3>
              <p className="text-xs text-slate-500">
                {items.length} {items.length === 1 ? 'منتج' : 'منتجات'}
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
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-['Tajawal']">
                تم استلام طلبك بنجاح!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                شكراً لتسوقك من <strong className="text-slate-900">متجر فهد (FAHAD)</strong> للأزياء والإكسسوارات. سنقوم بتجهيز طلبك وشحنه فوراً لعنوانك المسجل:
              </p>

              {/* Loyalty Points Alert */}
              <div className="p-3 bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 rounded-xl shadow-xs border border-amber-300 flex items-center justify-center gap-2 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-950 fill-amber-900" />
                <span>
                  {user
                    ? `تهانينا! كسبت +${earnedPointsThisOrder} نقطة ولاء أضيفت إلى ملفك الشخصي!`
                    : `أكمل تسجيلك في الشريط العلوي لتكسب +${earnedPointsThisOrder} نقطة مكافأة!`}
                </span>
              </div>

              {/* Placed Order Details & Tracking */}
              {placedOrder && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-right text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-800">رقم الطلب المعتمد:</span>
                    <span className="font-mono font-bold text-rose-600 dir-ltr">{placedOrder.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>حالة الطلب:</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                      قيد التجهيز من الإدارة
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>وجهة التوصيل:</span>
                    <span className="text-slate-800 font-medium">{placedOrder.city} - {placedOrder.address}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    ✓ تم إرسال وحفظ الطلب في حساب إدارة المتجر بنجاح.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {onViewOrdersInProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderCompleted(false);
                      onClose();
                      onViewOrdersInProfile();
                    }}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer"
                  >
                    عرض ومتابعة الطلب في الملف الشخصي
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOrderCompleted(false);
                    onClose();
                  }}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  العودة للمتجر
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-800">سلة التسوق فارغة</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                استكشف تشكيلة الملابس والإكسسوارات لجميع الفئات وأضف ما يعجبك!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-20 rounded-xl object-cover bg-slate-200 shrink-0 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="font-bold text-xs text-slate-900 truncate" title={item.product.name}>
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>المقاس: <strong className="text-slate-700">{item.selectedSize}</strong></span>
                      <span>•</span>
                      <span>اللون: <strong className="text-slate-700">{item.selectedColor}</strong></span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-rose-600 text-xs font-['Tajawal']">
                        {item.product.price * item.quantity} ريال
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
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3.5">
            {/* User Address Summary / Warning */}
            {user ? (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>عنوان التوصيل:</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    {user.currentCity || 'الرياض'} - {user.residenceCountry || 'السعودية'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {user.detailedAddress || 'حي النرجس، شارع عثمان، مبنى 14'}
                </p>
                {user.phone && (
                  <p className="text-[10px] text-slate-400" dir="ltr">
                    هاتف: {user.phone}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                <span>سجل حسابك في الشريط العلوي لحفظ عنوان الشحن تلقائياً</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthBar();
                  }}
                  className="font-bold text-amber-700 underline shrink-0 mr-2 cursor-pointer"
                >
                  تسجيل الآن
                </button>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-800 font-mono">{subtotal} ريال</span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الشحن والتوصيل:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {shipping === 0 ? 'مجاناً (عرض ترويجي)' : `${shipping} ريال`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>المجموع الإجمالي:</span>
                <span className="text-rose-600 font-mono font-['Tajawal'] text-base">
                  {total} ريال
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري تأكيد الطلب السحابي...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>إتمام الطلب والدفع ({total} ريال)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
