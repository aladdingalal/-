import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Share2,
  MapPin,
} from 'lucide-react';
import type { Product, UserProfile } from '../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  user: UserProfile | null;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  user,
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'مقاس موحد');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || 'افتراضي');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 rounded-full shadow-md transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Section */}
        <div className="w-full md:w-1/2 bg-slate-100 relative min-h-[300px] md:min-h-[460px] flex items-center justify-center overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {product.tag && (
            <span
              className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full shadow-md ${
                product.tagColor || 'bg-rose-500 text-white'
              }`}
            >
              {product.tag}
            </span>
          )}

          <button
            type="button"
            onClick={() => onToggleWishlist(product)}
            className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-slate-700 hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Info Section */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                {product.categoryName}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating}</span>
                <span className="text-slate-400 font-normal">({product.reviewsCount} تقييم)</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-900 font-['Tajawal']">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 font-['Tajawal']">
                {product.price}
              </span>
              <span className="text-sm font-bold text-slate-700">ريال سعودي</span>
              {product.originalPrice && (
                <span className="text-sm text-slate-400 line-through mr-1">
                  {product.originalPrice} ريال
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              {product.description}
            </p>

            {/* Colors Selection */}
            {product.colors.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-800 block">
                  اللون: <span className="text-rose-600">{selectedColor}</span>
                </span>
                <div className="flex items-center gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center shadow-xs cursor-pointer ${
                        selectedColor === color.name
                          ? 'border-rose-500 scale-110 ring-2 ring-rose-300'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <Check className={`w-3.5 h-3.5 ${color.hex === '#ffffff' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Selection */}
            {product.sizes.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-800 block">المقاس:</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedSize === size
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-800">الكمية:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-200 text-sm font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-slate-800 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-200 text-sm font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery address snippet */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {user?.currentCity ? (
                  <>توصيل سريع متاح لمدينة <strong>{user.currentCity}</strong> خلال 24-48 ساعة</>
                ) : (
                  <>شحن سريع مجاني للطلبات فوق 200 ريال لجميع المدن</>
                )}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleAdd}
              disabled={addedNotice}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
            >
              {addedNotice ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>تمت الإضافة إلى السلة بنجاح!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>إضافة للسلة ({product.price * quantity} ريال)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
