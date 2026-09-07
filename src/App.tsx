import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StoreHero } from './components/StoreHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CloudConfigModal } from './components/CloudConfigModal';
import { CustomerMessagesModal } from './components/CustomerMessagesModal';
import { CustomerProfilePopup } from './components/CustomerProfilePopup';
import { INITIAL_PRODUCTS } from './data/products';
import {
  testCloudConnection,
  getCurrentUser,
  loginWithEmail,
  registerNewUser,
  logoutCurrentSession,
  translateAppwriteError,
  getUserPoints,
} from './services/appwrite';
import type {
  UserProfile,
  CloudConnectionStatus,
  Product,
  ProductCategory,
  CartItem,
  UserRegistrationData,
} from './types';
import {
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  Shirt,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Grid,
} from 'lucide-react';

export default function App() {
  // Navigation & Modal State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  // 4-Products in One Square View State
  const [displayMode, setDisplayMode] = useState<'quad' | 'grid'>('quad');
  const [quadPage, setQuadPage] = useState(0);

  // User & Cloud Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<{ text: string; hint?: string } | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [cloudStatus, setCloudStatus] = useState<CloudConnectionStatus>({
    state: 'checking',
    message: 'جاري فحص حالة اتصال سحابة Appwrite...',
  });

  // E-Commerce State
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('games_farist_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('games_farist_wishlist_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Save cart & wishlist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('games_farist_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.warn(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('games_farist_wishlist_ids', JSON.stringify(wishlistIds));
    } catch (e) {
      console.warn(e);
    }
  }, [wishlistIds]);

  // Ping cloud connection
  const checkCloudHealth = useCallback(async () => {
    setCloudStatus((prev) => ({ ...prev, state: 'checking' }));
    const result = await testCloudConnection();
    setCloudStatus(result);
  }, []);

  // Check active user session on load
  const loadUserSession = useCallback(async () => {
    try {
      const existingUser = await getCurrentUser();
      if (existingUser) {
        setUser(existingUser);
      }
    } catch (err) {
      console.log('No active session:', err);
    }
  }, []);

  useEffect(() => {
    checkCloudHealth();
    loadUserSession();
  }, [checkCloudHealth, loadUserSession]);

  // Handle Login from Top Bar
  const handleLogin = async (email: string, pass: string) => {
    setLoadingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const loggedProfile = await loginWithEmail(email, pass);
      setUser(loggedProfile);
      setAuthSuccess('تم تسجيل الدخول بنجاح! مرحباً بك في متجر فهد (FAHAD).');
      setIsProfilePopupOpen(true);
    } catch (error: any) {
      console.error('Login error:', error);
      const translated = translateAppwriteError(error);
      setAuthError({
        text: translated.text,
        hint: translated.hint,
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Register with the requested fields (phone, residence, city, detailed address)
  const handleRegister = async (data: UserRegistrationData) => {
    setLoadingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const newProfile = await registerNewUser(
        data.name,
        data.email,
        data.password,
        {
          phone: data.phone,
          residenceCountry: data.residenceCountry,
          currentCity: data.currentCity,
          detailedAddress: data.detailedAddress,
        }
      );
      setUser(newProfile);
      setAuthSuccess('تم إنشاء الحساب وحفظ بيانات الإقامة والعنوان بنجاح في السحابة!');
      setIsProfilePopupOpen(true);
    } catch (error: any) {
      console.error('Register error:', error);
      const translated = translateAppwriteError(error);
      setAuthError({
        text: translated.text,
        hint: translated.hint,
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutCurrentSession();
      setUser(null);
      setAuthSuccess('تم تسجيل الخروج بنجاح.');
      setTimeout(() => setAuthSuccess(null), 2500);
    } catch (err: any) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity: number = 1
  ) => {
    setCartItems((prev) => {
      const itemKey = `${product.id}-${size}-${color}`;
      const existingIndex = prev.findIndex((item) => item.id === itemKey);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: itemKey,
            product,
            quantity,
            selectedSize: size,
            selectedColor: color,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handlePointsUpdated = () => {
    if (user?.email) {
      const updatedPoints = getUserPoints(user.email);
      setUser((prev) => (prev ? { ...prev, loyaltyPoints: updatedPoints } : prev));
    }
  };

  // Wishlist toggle
  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  // Categories with counts
  const categoriesList = useMemo(() => {
    return [
      { id: 'all' as ProductCategory, name: 'كل المنتجات', count: products.length, iconBg: 'bg-rose-500' },
      { id: 'men' as ProductCategory, name: 'رجالي', count: products.filter((p) => p.category === 'men').length, iconBg: 'bg-blue-600' },
      { id: 'women' as ProductCategory, name: 'نسائي', count: products.filter((p) => p.category === 'women').length, iconBg: 'bg-pink-500' },
      { id: 'kids' as ProductCategory, name: 'أطفال', count: products.filter((p) => p.category === 'kids').length, iconBg: 'bg-amber-500' },
      { id: 'accessories' as ProductCategory, name: 'إكسسوارات وساعات', count: products.filter((p) => p.category === 'accessories').length, iconBg: 'bg-purple-600' },
      { id: 'shoes' as ProductCategory, name: 'أحذية وحقائب', count: products.filter((p) => p.category === 'shoes').length, iconBg: 'bg-emerald-600' },
    ];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Quad Pagination (4 products in one square box / single screen)
  const QUAD_SIZE = 4;
  const totalQuadPages = Math.max(1, Math.ceil(filteredProducts.length / QUAD_SIZE));

  useEffect(() => {
    setQuadPage(0);
  }, [selectedCategory, searchQuery]);

  const currentQuadProducts = useMemo(() => {
    if (displayMode === 'grid') return filteredProducts;
    const start = quadPage * QUAD_SIZE;
    return filteredProducts.slice(start, start + QUAD_SIZE);
  }, [filteredProducts, quadPage, displayMode]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Return to Home Page when Logo is clicked as explicitly requested
  const handleGoHome = useCallback(() => {
    setSelectedCategory('all');
    setSearchQuery('');
    setDisplayMode('quad');
    setQuadPage(0);
    setIsProfilePopupOpen(false);
    setIsCartOpen(false);
    setIsSettingsOpen(false);
    setIsMessagesOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Cairo'] relative selection:bg-rose-500 selection:text-white overflow-x-hidden">
      {/* 1. Clean Header: Brand Logo & Name (Returns Home), Cart (السلة), and Unified Hub */}
      <Navbar
        status={cloudStatus}
        user={user}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenUnifiedRoom={() => setIsProfilePopupOpen(true)}
        onGoHome={handleGoHome}
      />

      {/* 2. Main Body Content - Focused E-Commerce Store */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="space-y-6 sm:space-y-8">
          {/* Hero & Category Selection */}
          <StoreHero
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={categoriesList}
          />

            {/* Product Catalog Section */}
            <div className="space-y-4">
              {/* Header with results count & filter badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Tajawal']">
                    {selectedCategory === 'all'
                      ? 'جميع الملابس والإكسسوارات'
                      : categoriesList.find((c) => c.id === selectedCategory)?.name}
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {filteredProducts.length} قطعة
                  </span>
                </div>

                {/* View Switcher: 4 Products in One Square vs Full Grid */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('quad')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        displayMode === 'quad'
                          ? 'bg-white text-rose-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="عرض 4 منتجات في مربع واحد يظهر في شاشة واحدة"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>مربع 4 منتجات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('grid')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        displayMode === 'grid'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="عرض جميع المنتجات في شبكة كاملة"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>شبكة الكل</span>
                    </button>
                  </div>

                  {searchQuery && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>نتائج البحث عن:</span>
                      <strong className="text-rose-600">"{searchQuery}"</strong>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-700 underline mr-1 cursor-pointer"
                      >
                        إلغاء البحث
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Grid / Quad Display */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    لم نجد منتجات مطابقة لطلبك
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    جرب البحث بكلمات أخرى أو اختر فئة مختلفة من الملابس والإكسسوارات.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    عرض جميع المنتجات
                  </button>
                </div>
              ) : displayMode === 'quad' ? (
                /* Requested 4-Products in One Square Box appearing in a Single Screen */
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="bg-gradient-to-b from-white to-slate-50/70 border-2 border-slate-200/90 rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-4">
                    {/* Square Showcase Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-rose-500/10">
                          ٤
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-black text-slate-900 font-['Tajawal']">
                              مربع العرض الرباعي
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                              ٤ منتجات في شاشة واحدة
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            المجموعة {quadPage + 1} من {totalQuadPages} • إجمالي {filteredProducts.length} قطعة
                          </p>
                        </div>
                      </div>

                      {/* Quad Navigation Arrows */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={quadPage === 0}
                          onClick={() => setQuadPage((p) => Math.max(0, p - 1))}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="المجموعة السابقة"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span className="hidden sm:inline">السابق</span>
                        </button>

                        <span className="text-xs font-bold text-slate-800 px-2 font-mono bg-slate-100 py-1 rounded-lg">
                          {quadPage + 1} / {totalQuadPages}
                        </span>

                        <button
                          type="button"
                          disabled={quadPage >= totalQuadPages - 1}
                          onClick={() => setQuadPage((p) => Math.min(totalQuadPages - 1, p + 1))}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="المجموعة التالية"
                        >
                          <span className="hidden sm:inline">التالي</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 2x2 Square Grid: 4 Products in One Square Box */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                      {currentQuadProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          compact={true}
                          onSelect={(prod) => setSelectedProductForModal(prod)}
                          onAddToCart={(prod, size, color) =>
                            handleAddToCart(prod, size, color, 1)
                          }
                          isWishlisted={wishlistIds.includes(product.id)}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      ))}
                    </div>

                    {/* Square Showcase Footer Controls */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalQuadPages }).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuadPage(idx)}
                            className={`transition-all rounded-full cursor-pointer ${
                              quadPage === idx
                                ? 'w-6 h-2 bg-rose-600'
                                : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                            title={`الانتقال للمجموعة ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          عرض 4 قطع في مربع واحد
                        </span>
                        <button
                          type="button"
                          onClick={() => setDisplayMode('grid')}
                          className="text-rose-600 hover:text-rose-700 text-[11px] font-bold hover:underline cursor-pointer"
                        >
                          عرض كل المنتجات في شبكة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Full Multi-Column Grid Display */
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('quad')}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>العودة لعرض 4 منتجات في مربع واحد</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={(prod) => setSelectedProductForModal(prod)}
                        onAddToCart={(prod, size, color) =>
                          handleAddToCart(prod, size, color, 1)
                        }
                        isWishlisted={wishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
      </main>

      {/* 5. Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 text-xs text-slate-600 mt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoHome}
                className="flex items-center gap-2 cursor-pointer group text-right"
                title="العودة للصفحة الرئيسية لمتجر فهد"
              >
                <span className="font-black text-slate-900 text-lg font-['Tajawal'] flex items-center gap-1.5 group-hover:text-rose-600 transition-colors">
                  <span>فهد</span>
                  <span className="text-xs font-sans text-rose-600 font-black">FAHAD</span>
                </span>
                <span className="text-[10px] bg-gradient-to-r from-rose-500 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                  متجر أزياء وإكسسوارات
                </span>
              </button>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                متجر فهد (FAHAD) للأزياء والإكسسوارات الفاخرة لجميع الفئات، مع نظام نقاط ومكافآت مستمر مع كل عملية شراء وربط سحابي متين عبر Appwrite.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">فئات المنتجات</h5>
              <ul className="space-y-1 text-[11px] text-slate-500">
                <li className="hover:text-rose-600 cursor-pointer" onClick={() => setSelectedCategory('men')}>ملابس رجالية</li>
                <li className="hover:text-rose-600 cursor-pointer" onClick={() => setSelectedCategory('women')}>ملابس نسائية</li>
                <li className="hover:text-rose-600 cursor-pointer" onClick={() => setSelectedCategory('kids')}>ملابس أطفال</li>
                <li className="hover:text-rose-600 cursor-pointer" onClick={() => setSelectedCategory('accessories')}>ساعات وإكسسوارات</li>
                <li className="hover:text-rose-600 cursor-pointer" onClick={() => setSelectedCategory('shoes')}>أحذية وحقائب جلدية</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">خدمة العملاء والشحن</h5>
              <ul className="space-y-1 text-[11px] text-slate-500">
                <li>شحن مجاني للطلبات فوق 200 ريال</li>
                <li>توصيل سريع لجميع المدن والمحافظات</li>
                <li>دفع عند الاستلام وبطاقات مدى وVisa</li>
                <li>استبدال واسترجاع سهل خلال 14 يوماً</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">الاتصال بالسحابة والرسائل</h5>
              <p className="text-[11px] text-slate-500">
                النظام متصل بخادم Appwrite Cloud بالمفتاح البرمجي لحفظ الصور والاحتفاظ بكافة رسائل واستفسارات العملاء.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsMessagesOpen(true)}
                  className="text-amber-700 font-bold hover:underline text-xs cursor-pointer text-right flex items-center gap-1"
                >
                  <span>✉️ فتح صندوق الرسائل السحابي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-rose-600 font-bold hover:underline text-xs cursor-pointer text-right"
                >
                  إعدادات المشروع والمفتاح السحابي
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} متجر فهد | FAHAD Fashion Store</span>
            <div className="flex items-center gap-3">
              <span>ألوان فاتحة RGB</span>
              <span>•</span>
              <span>متوافق مع الهواتف والحواسيب</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. Product Details Modal */}
      <ProductDetailsModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={selectedProductForModal ? wishlistIds.includes(selectedProductForModal.id) : false}
        onToggleWishlist={handleToggleWishlist}
        user={user}
      />

      {/* 7. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        user={user}
        onOpenAuthBar={() => setIsProfilePopupOpen(true)}
        onPointsUpdated={handlePointsUpdated}
      />

      {/* 8. Cloud Config Modal */}
      <CloudConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={checkCloudHealth}
      />

      {/* 9. Customer Messages Retention Modal */}
      <CustomerMessagesModal
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        currentUser={user}
      />

      {/* 10. Unified Customer Room: Profile, Messages, Updates, and Auth */}
      <CustomerProfilePopup
        user={user}
        isOpen={isProfilePopupOpen}
        onClose={() => setIsProfilePopupOpen(false)}
        onLogout={() => {
          handleLogout();
          setIsProfilePopupOpen(false);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
        loadingAuth={loadingAuth}
        authError={authError}
        authSuccess={authSuccess}
        onClearMessages={() => {
          setAuthError(null);
          setAuthSuccess(null);
        }}
        cloudStatus={cloudStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
