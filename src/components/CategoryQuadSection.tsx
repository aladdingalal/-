import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Layers,
  ExternalLink,
} from 'lucide-react';
import type { Product, ProductCategory } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryQuadSectionProps {
  categoryId: ProductCategory;
  categoryName: string;
  description?: string;
  iconBg?: string;
  products: Product[];
  onSelectCategoryPage: (catId: ProductCategory) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product) => void;
}

export const CategoryQuadSection: React.FC<CategoryQuadSectionProps> = ({
  categoryId,
  categoryName,
  description,
  iconBg = 'bg-rose-500',
  products,
  onSelectCategoryPage,
  onSelectProduct,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const QUAD_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(products.length / QUAD_SIZE));

  const pageProducts = products.slice(
    currentPage * QUAD_SIZE,
    currentPage * QUAD_SIZE + QUAD_SIZE
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-white to-slate-50/80 border-2 border-slate-200/90 rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3.5">
      {/* 1. Category Header & Navigation to Dedicated Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl ${iconBg} text-white flex items-center justify-center font-black text-sm shadow-md shadow-slate-900/10 shrink-0`}
          >
            ٤
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Tajawal']">
                {categoryName}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {products.length} منتج
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                عرض ٤*٤
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {description || `تشكيلة مختارة من ${categoryName} الفاخرة متجددة باستمرار`}
            </p>
          </div>
        </div>

        {/* Action Controls: Cycle 4x4 or Go to Dedicated Category Page */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Cycle pages on home page */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-700 font-mono px-1">
                {currentPage + 1}/{totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Button to navigate to dedicated category page */}
          <button
            type="button"
            onClick={() => onSelectCategoryPage(categoryId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-gradient-to-r hover:from-rose-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
            title={`الانتقال إلى صفحة ${categoryName} المخصصة`}
          >
            <span>صفحة الفئة</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 2. 4-Product 2x2 Square Grid Layout */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {pageProducts.map((product) => (
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

      {/* 3. Section Footer with dedicated page link & pagination indicator */}
      <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPage(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentPage === idx
                  ? 'w-6 bg-slate-900'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`صفحة ${idx + 1}`}
            />
          ))}
          <span className="text-[11px] text-slate-500 mr-2 font-mono">
            صفحة {currentPage + 1} من {totalPages}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelectCategoryPage(categoryId)}
          className="text-slate-700 hover:text-rose-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>تصفح كامل تشكيلة {categoryName} في صفحتها المستقلة</span>
          <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
        </button>
      </div>
    </div>
  );
};
