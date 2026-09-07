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
    <section className="w-full space-y-6">
      {/* Light RGB Vibrant Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-100 via-sky-50 to-emerald-100 border border-slate-200/90 p-6 sm:p-10 shadow-sm">
        {/* Subtle decorative RGB background blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xs text-xs font-bold text-slate-800">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>تشكيلة الموسم الجديدة - خصومات تصل إلى 40%</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-['Tajawal'] tracking-tight leading-tight">
            أناقة متجددة لكل العائلة <br />
            <span className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ملابس وإكسسوارات فاخرة
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            اكتشف أحدث صيحات الموضة للرجال، النساء، والأطفال مع تشكيلة منسقة بعناية من الساعات، الحقائب، والأحذية بجودة عالمية وشحن سريع لجميع المدن.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>تسوق كل المنتجات</span>
            </button>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ضمان أصالة المنتجات 100%</span>
            </div>
          </div>
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
