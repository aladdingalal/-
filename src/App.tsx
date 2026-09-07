import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { OptionalAuthTopBar } from './components/OptionalAuthTopBar';
import { StoreHero } from './components/StoreHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CloudImageTestingPage } from './components/CloudImageTestingPage';
import { CloudConfigModal } from './components/CloudConfigModal';
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
  Smartphone,
  Monitor,
  Tablet,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  Shirt,
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<'store' | 'cloudLab'>('store');
  const [isAuthBarExpanded, setIsAuthBarExpanded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      setAuthSuccess('تم تسجيل الدخول بنجاح! مرحباً بك في متجر Games farist.');
      setTimeout(() => {
        setIsAuthBarExpanded(false);
      }, 1400);
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
      setTimeout(() => {
        setIsAuthBarExpanded(false);
      }, 1600);
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

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Cairo'] relative selection:bg-rose-500 selection:text-white">
      {/* 1. Optional Top Bar for Login & Registration (Requested) */}
      <OptionalAuthTopBar
        user={user}
        cloudStatus={cloudStatus}
        isExpanded={isAuthBarExpanded}
        onToggleExpand={() => setIsAuthBarExpanded(!isAuthBarExpanded)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onOpenCloudSettings={() => setIsSettingsOpen(true)}
        onOpenCloudLab={() => setCurrentView('cloudLab')}
        loading={loadingAuth}
        errorMsg={authError}
        successMsg={authSuccess}
        onClearMessages={() => {
          setAuthError(null);
          setAuthSuccess(null);
        }}
      />

      {/* 2. E-Commerce Store Navigation Bar */}
      <Navbar
        status={cloudStatus}
        user={user}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleAuthBar={() => setIsAuthBarExpanded(!isAuthBarExpanded)}
        onOpenCloudLab={() => setCurrentView('cloudLab')}
      />

      {/* 3. Responsive Screen Support Banner */}
      <div className="w-full bg-white border-b border-slate-200/80 py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-rose-500" />
            <span>متوافق تماماً مع جميع الهواتف</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Tablet className="w-3.5 h-3.5 text-indigo-500" />
            <span>الأجهزة اللوحية</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-emerald-500" />
            <span>شاشات الحواسيب فائقة الدقة</span>
          </span>
        </div>
      </div>

      {/* 4. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'cloudLab' ? (
          /* Cloud Testing Laboratory View */
          user ? (
            <CloudImageTestingPage
              user={user}
              cloudStatus={cloudStatus}
              onLogout={handleLogout}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onTestPing={checkCloudHealth}
              onBackToStore={() => setCurrentView('store')}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-12 px-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Shirt className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Tajawal']">
                تسجيل الدخول مطلوب لمعمل السحاب
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                يرجى تسجيل الدخول أو إنشاء حساب جديد في الشريط العلوي لتتمكن من رفع صور الاختبارات إلى حاوية Appwrite.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthBarExpanded(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  فتح شريط التسجيل
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('store')}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  العودة للمتجر
                </button>
              </div>
            </div>
          )
        ) : (
          /* Primary E-Commerce Store View */
          <div className="space-y-8">
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

              {/* Product Grid */}
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
              ) : (
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
              )}
            </div>
          </div>
        )}
      </main>

      {/* 5. Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 text-xs text-slate-600 mt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-lg font-['Tajawal'] flex items-center gap-1.5">
                  <span>فهد</span>
                  <span className="text-xs font-sans text-rose-600 font-black">FAHAD</span>
                </span>
                <span className="text-[10px] bg-gradient-to-r from-rose-500 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                  متجر أزياء وإكسسوارات
                </span>
              </div>
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
              <h5 className="font-bold text-slate-900">الاتصال بالسحابة</h5>
              <p className="text-[11px] text-slate-500">
                النظام متصل بخادم Appwrite Cloud 14 مع حفظ دائم لبيانات التسجيل وعناوين الشحن.
              </p>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="text-rose-600 font-bold hover:underline text-xs cursor-pointer block"
              >
                إعدادات المشروع وحاوية التخزين
              </button>
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
        onOpenAuthBar={() => setIsAuthBarExpanded(true)}
        onPointsUpdated={handlePointsUpdated}
      />

      {/* 8. Cloud Config Modal */}
      <CloudConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={checkCloudHealth}
      />
    </div>
  );
}
