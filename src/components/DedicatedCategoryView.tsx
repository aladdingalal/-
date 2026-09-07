import React, { useState, useEffect } from 'react';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers,
  Filter,
  ArrowLeft,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import type { Product, ProductCategory } from '../types';
import { ProductCard } from './ProductCard';

interface DedicatedCategoryViewProps {
  categoryId: ProductCategory;
  categoryName: string;
  categoryIconBg: string;
  products: Product[];
  categoriesList: { id: ProductCategory; name: string; count: number; iconBg: string }[];
  onSelectCategory: (cat: ProductCategory) => void;
  onGoHome: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product) => void;
}

export const DedicatedCategoryView: React.FC<DedicatedCategoryViewProps> = ({
  categoryId,
  categoryName,
  categoryIconBg,
  products,
  categoriesList,
  onSelectCategory,
  onGoHome,
  onSelectProduct,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [page, setPage] = useState(0);
  const [displayLayout, setDisplayLayout] = useState<'quad' | 'grid'>('quad');
  const QUAD_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(products.length / QUAD_SIZE));

  // Reset page whenever category changes
  useEffect(() => {
    setPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryId]);

  const currentProducts =
    displayLayout === 'quad'
      ? products.slice(page * QUAD_SIZE, page * QUAD_SIZE + QUAD_SIZE)
      : products;

  const categoryDescriptions: Record<string, string> = {
    men: 'تشكيلة الملابس الرجالية الفاخرة: بدل رسمية، هوديات مريحة، قمصان قطنية، وجينزات كلاسيكية بأعلى درجات الراحة والأناقة.',
    women: 'أحدث صيحات الأزياء النسائية: فساتين راقية، عبايات كريب خليجية، بليزرات عملية وأطقم كاجوال بتصاميم استثنائية.',
    kids: 'أزياء ومستلزمات الأطفال: بيجامات قطنية ناعمة، فساتين ملونة، جاكيتات دافئة، وسنيكرز خفيف لراحة طفلك اليومية.',
    accessories: 'أفخم الساعات والإكسسوارات: ساعات كوارتز، نظارات شمسية عصرية، أساور فضية، ومحافظ جلد طبيعي تضفي لمسة رفاهية.',
    shoes: 'أحذية وحقائب جلدية أصلية: أحذية كلاسيكية ورياضية، صنادل صيفية، وحقائب ظهر متعددة المهام متينة وعملية.',
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 1. Breadcrumbs Navigation & Back to Home */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-2xs">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-600" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-1.5 text-slate-700 hover:text-rose-600 transition-colors cursor-pointer"
            title="العودة للصفحة الرئيسية"
          >
            <Home className="w-3.5 h-3.5" />
            <span>الرئيسية</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">الفئات المخصصة</span>
          <span className="text-slate-300">/</span>
          <span className="text-rose-600 font-black">{categoryName}</span>
        </nav>

        {/* Back Button */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          title="العودة لجميع فئات المتجر في الصفحة الرئيسية"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للرئيسية (كافة الفئات)</span>
        </button>
      </div>

      {/* 2. Dedicated Category Page Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-7 shadow-md border border-slate-800">
        <div className="relative z-10 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl ${categoryIconBg} text-white flex items-center justify-center text-xs font-black shadow-xs`}
            >
              ٤
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
              صفحة مخصصة لـ {categoryName}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
              {products.length} قطعة متوفرة
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-['Tajawal'] text-white">
            تشكيلة {categoryName} الكاملة
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {categoryDescriptions[categoryId] ||
              `تصفح أحدث موديلات ${categoryName} الحصرية بأسلوب العرض الرباعي ٤*٤ المخصص للموبايل وسطح المكتب.`}
          </p>

          {/* Quick Category Jumper within dedicated view */}
          <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-slate-400 whitespace-nowrap ml-1">انتقال سريع لفئة أخرى:</span>
            {categoriesList
              .filter((c) => c.id !== 'all')
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    cat.id === categoryId
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* 3. Navigation Explanation & View Controls */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-bold">
            طريقة الانتقال بين الصفحات:
          </span>
          <span className="text-amber-800 text-[11px]">
            يتم عرض ٤ منتجات في كل شاشة (٤*٤). استخدم أزرار الأرقام (1، 2..) أو أزرار التالي والسابق أدناه لتصفح باقي منتجات الفئة.
          </span>
        </div>

        {/* View Switcher: Quad 4x4 vs Full Grid */}
        <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-xl p-0.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setDisplayLayout('quad')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              displayLayout === 'quad'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عرض ٤*٤
          </button>
          <button
            type="button"
            onClick={() => setDisplayLayout('grid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              displayLayout === 'grid'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الشبكة الكاملة
          </button>
        </div>
      </div>

      {/* 4. Products Display (4x4 Box or Grid) */}
      {displayLayout === 'quad' ? (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-white to-slate-50/80 border-2 border-slate-200/90 rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-4">
          {/* Quad Box Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {page + 1}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  الصفحة {page + 1} من {totalPages}
                </h3>
                <p className="text-[10px] text-slate-500">
                  عرض المنتجات من {page * QUAD_SIZE + 1} إلى{' '}
                  {Math.min((page + 1) * QUAD_SIZE, products.length)} من إجمالي{' '}
                  {products.length} قطعة
                </p>
              </div>
            </div>

            {/* Pagination Controls in Header */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="السابق"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابق</span>
              </button>

              <span className="text-xs font-bold text-slate-800 px-2 font-mono bg-slate-100 py-1 rounded-lg">
                {page + 1} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="التالي"
              >
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2x2 Square Grid for 4 Products */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                compact={true}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>

          {/* Quad Box Bottom Pagination Bar with Numbered Buttons */}
          <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">الانتقال السريع للصفحة:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPage(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === idx
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onGoHome}
              className="text-rose-600 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>العودة للرئيسية وتصفح باقي الفئات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {currentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}

      {/* 5. Back to Home Banner */}
      <div className="text-center py-6 bg-slate-100/70 border border-slate-200 rounded-3xl space-y-2">
        <p className="text-xs text-slate-600 font-bold">
          هل تريد استكشاف فئات أخرى أو العودة إلى الصفحة الرئيسية؟
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className="px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>الصفحة الرئيسية (عرض جميع الفئات)</span>
        </button>
      </div>
    </div>
  );
};
