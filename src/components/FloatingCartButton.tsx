import React, { useEffect, useState } from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface FloatingCartButtonProps {
  cartCount: number;
  totalAmount: number;
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  cartCount,
  totalAmount,
  onClick,
  isOpen,
}) => {
  const [isBumping, setIsBumping] = useState(false);

  // Trigger brief bounce animation whenever cartCount changes
  useEffect(() => {
    if (cartCount > 0) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  if (isOpen) {
    return null;
  }

  return (
    <div
      id="floating-cart-container"
      className="fixed bottom-5 left-5 sm:bottom-7 sm:left-7 z-40 print:hidden transition-all duration-300"
    >
      <button
        id="floating-cart-button"
        type="button"
        onClick={onClick}
        aria-label={`سلة التسوق (${cartCount} قطع)`}
        title={`سلة التسوق - ${cartCount > 0 ? `${cartCount} قطع بقيمة ${totalAmount} ج.م` : 'فارغة'}`}
        className={`group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-xl transition-all duration-300 cursor-pointer active:scale-95 border border-white/20 select-none ${
          isBumping ? 'scale-110 ring-4 ring-rose-400/50' : 'hover:scale-105'
        } ${
          cartCount > 0
            ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 text-white shadow-rose-600/30 hover:shadow-2xl hover:shadow-rose-600/40'
            : 'bg-slate-900/90 hover:bg-slate-900 text-white shadow-slate-900/25 hover:shadow-xl backdrop-blur-md'
        }`}
      >
        {/* Shopping Bag Icon with Count Badge */}
        <div className="relative flex items-center justify-center">
          <ShoppingBag className={`w-5 h-5 transition-transform duration-300 ${isBumping ? 'rotate-12 scale-125' : 'group-hover:scale-110'}`} />
          {cartCount > 0 && (
            <span
              id="floating-cart-badge"
              className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center shadow-md border-2 border-white"
            >
              {cartCount}
            </span>
          )}
        </div>

        {/* Text and Amount */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold font-['Tajawal']">
          <span className="tracking-wide">السلة</span>

          {cartCount > 0 ? (
            <>
              <span className="w-1 h-1 rounded-full bg-white/60" />
              <span className="font-mono text-xs sm:text-sm text-amber-200 font-black">
                {totalAmount} ج.م
              </span>
              <ArrowLeft className="w-3.5 h-3.5 opacity-70 group-hover:-translate-x-1 transition-transform" />
            </>
          ) : (
            <span className="text-[11px] text-slate-300 font-normal hidden sm:inline">
              (فارغة)
            </span>
          )}
        </div>

        {/* Ambient Glow for non-empty cart */}
        {cartCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping -z-10 pointer-events-none opacity-40" />
        )}
      </button>
    </div>
  );
};
