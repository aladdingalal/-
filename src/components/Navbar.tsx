import React from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  Sparkles,
  Cloud,
  SlidersHorizontal,
  Shirt,
} from 'lucide-react';
import type { CloudConnectionStatus, UserProfile } from '../types';

interface NavbarProps {
  status: CloudConnectionStatus;
  user: UserProfile | null;
  cartCount: number;
  wishlistCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onToggleAuthBar: () => void;
  onOpenCloudLab: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  user,
  cartCount,
  wishlistCount,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onToggleAuthBar,
  onOpenCloudLab,
}) => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 p-0.5 shadow-md shadow-rose-500/20">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-rose-600 font-black text-xl font-['Tajawal']">
              ف
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 font-['Tajawal'] flex items-center gap-1.5">
                <span>فهد</span>
                <span className="text-xs sm:text-sm font-black font-sans text-rose-600 tracking-wider">FAHAD</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-xs">
                أزياء وإكسسوارات
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              متجر فهد للأزياء الراقية لكل الفئات | FAHAD Fashion Store
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن جاكيت، فستان، ساعة، حذاء، إكسسوارات..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-100/90 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Actions & Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Lab Button */}
          <button
            type="button"
            onClick={onOpenCloudLab}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="معمل رفع الصور السحابية"
          >
            <Cloud className="w-4 h-4 text-sky-600" />
            <span>معمل السحاب</span>
          </button>

          {/* User Account / Auth Bar Toggle */}
          <button
            type="button"
            onClick={onToggleAuthBar}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
            title="الحساب وتسجيل الدخول"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">
              {user ? (user.name ? user.name[0] : 'U') : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="hidden lg:inline">
              {user ? (user.name || 'حسابي') : 'تسجيل الدخول'}
            </span>
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 p-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-gradient-to-r hover:from-rose-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all cursor-pointer"
            title="سلة التسوق"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">السلة</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search input */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث عن ملابس، ساعات، أحذية..."
            className="w-full pr-10 pl-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-xs"
          />
        </div>
      </div>
    </header>
  );
};
