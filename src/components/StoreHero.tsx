import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Tag,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import type { ProductCategory } from '../types';

interface StoreHeroProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  categories: { id: ProductCategory; name: string; count: number; iconBg: string }[];
}

export const StoreHero: React.FC<StoreHeroProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  return (
    <section className="w-full space-y-4 sm:space-y-6">
      {/* Light RGB Vibrant Hero Banner - Compact on Mobile */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-100 via-sky-50 to-emerald-100 border border-slate-200/90 p-4 sm:p-7 lg:p-10 shadow-sm">
        {/* Subtle decorative RGB background blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-2.5 sm:space-y-4 text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xs text-[11px] sm:text-xs font-bold text-slate-800">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>تشكيلة الموسم الجديدة - خصومات حتى 40%</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-['Tajawal'] tracking-tight leading-tight">
            أناقة متجددة لكل العائلة •{' '}
            <span className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              متجر فهد
            </span>
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-600 max-w-xl leading-relaxed">
            أحدث صيحات الأزياء للرجال، النساء، والأطفال وإكسسوارات فاخرة بجودة عالمية وشحن سريع.
          </p>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Trust & Features Strip in Light RGB styling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">شحن سريع</h4>
            <p className="text-[11px] text-slate-500">توصيل لجميع المدن</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">دفع آمن</h4>
            <p className="text-[11px] text-slate-500">حماية كاملة للمعاملات</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">استرجاع مرن</h4>
            <p className="text-[11px] text-slate-500">خلال 14 يوماً بسهولة</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">أفضل الأسعار</h4>
            <p className="text-[11px] text-slate-500">عروض متجددة أسبوعياً</p>
          </div>
        </div>
      </div>
    </section>
  );
};
