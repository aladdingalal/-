import React from 'react';
import { Star, ShoppingBag, Heart, Eye } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-rose-200 transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative w-full aspect-4/5 bg-slate-100 overflow-hidden cursor-pointer">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onClick={() => onSelect(product)}
        />

        {/* Tag / Badge with RGB color accent */}
        {product.tag && (
          <span
            className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
              product.tagColor || 'bg-rose-500 text-white'
            }`}
          >
            {product.tag}
          </span>
        )}

        {/* Category Pill */}
        <span className="absolute bottom-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-700 shadow-xs border border-slate-200">
          {product.categoryName}
        </span>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-xs ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
          }`}
          title={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Hover Overlay Button */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="pointer-events-auto px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة وتفاصيل</span>
          </button>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-1">
            <div className="flex items-center">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-slate-700">{product.rating}</span>
            <span className="text-slate-400 text-[11px]">({product.reviewsCount})</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-slate-900 text-sm hover:text-rose-600 transition-colors line-clamp-1 cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-1 mt-1">
            {product.description}
          </p>
        </div>

        {/* Color swatches preview */}
        <div className="flex items-center gap-1.5">
          {product.colors.map((c, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full border border-slate-300 shadow-xs"
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
          <span className="text-[10px] text-slate-400 font-medium mr-1">
            {product.sizes.length > 1 ? `${product.sizes.length} مقاسات` : product.sizes[0]}
          </span>
        </div>

        {/* Price and Add to Cart */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-rose-600 font-['Tajawal']">
                {product.price}
              </span>
              <span className="text-xs font-bold text-slate-600">ريال</span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onAddToCart(
                product,
                product.sizes[0] || 'مقاس موحد',
                product.colors[0]?.name || 'افتراضي'
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-gradient-to-r hover:from-rose-500 hover:to-indigo-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="إضافة سريعة للسلة"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>أضف</span>
          </button>
        </div>
      </div>
    </div>
  );
};
