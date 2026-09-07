import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  Sparkles,
  MessageSquare,
  X,
  Layers,
  UserPlus,
  LogIn,
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
  onOpenProfile: (tab?: 'login' | 'register' | 'orders' | 'messages' | 'profile' | 'wallet' | 'admin-orders' | 'admin-messages') => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  user,
  cartCount,
  wishlistCount,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenProfile,
  onGoHome,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. Brand Logo & Name (Clicking returns to Home page as requested) */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer group text-right focus:outline-none"
          title="العودة إلى الصفحة الرئيسية لمتجر فهد"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 p-0.5 shadow-md shadow-rose-500/15 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-rose-600 font-black text-lg sm:text-xl font-['Tajawal']">
              ف
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-2xl tracking-tight text-slate-900 font-['Tajawal'] group-hover:text-rose-600 transition-colors">
                فهد
              </span>
              <span className="text-[11px] sm:text-xs font-black font-sans text-rose-600 tracking-wider">
                FAHAD
              </span>
              <span className="hidden xs:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                أزياء
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
              الصفحة الرئيسية • متجر الأزياء
            </span>
          </div>
        </button>

        {/* 2. Desktop Search Input */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في ملابس وإكسسوارات فهد..."
              className="w-full pr-10 pl-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Actions: Mobile Search Toggle + Unified Room + Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="بحث"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Customer Profile & Messages Button OR Auth Buttons */}
          {user ? (
            <button
              type="button"
              onClick={() => onOpenProfile()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs"
              title="الملف الشخصي والطلبات والمراسلات"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline font-bold">
                  {user.name.split(' ')[0]}
                </span>
                <span className="sm:hidden text-[11px] font-bold">
                  حسابي
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => onOpenProfile('register')}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:opacity-95 text-white text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="تسجيل حساب جديد كعضو والحصول على 50 نقطة مكافأة"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل كعضو جديد</span>
                <span className="sm:hidden">عضو جديد</span>
                <span className="text-[9px] bg-white/20 px-1 rounded-sm font-mono">+50ن</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenProfile('login')}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold transition-all cursor-pointer border border-slate-200"
                title="تسجيل الدخول"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول</span>
              </button>
            </div>
          )}

          {/* Cart Button (السلة) */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-gradient-to-r hover:from-rose-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all cursor-pointer"
            title="سلة التسوق"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="font-bold">السلة</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      {isMobileSearchOpen && (
        <div className="px-3 pb-2.5 md:hidden border-t border-slate-100 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن ملابس، أحذية، ساعات..."
              autoFocus
              className="w-full pr-10 pl-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
