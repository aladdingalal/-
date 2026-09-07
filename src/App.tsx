import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StoreHero } from './components/StoreHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CloudConfigModal } from './components/CloudConfigModal';
import { CustomerMessagesModal } from './components/CustomerMessagesModal';
import { CustomerProfilePopup } from './components/CustomerProfilePopup';
import { ProfilePage } from './components/ProfilePage';
import { CategoryQuadSection } from './components/CategoryQuadSection';
import { DedicatedCategoryView } from './components/DedicatedCategoryView';
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
  const [currentView, setCurrentView] = useState<'store' | 'profile'>('store');
  const [profileInitialTab, setProfileInitialTab] = useState<'orders' | 'messages' | 'profile' | 'wallet' | 'admin-orders' | 'admin-messages' | undefined>(undefined);
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
      setCurrentView('profile');
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
      setCurrentView('profile');
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

  const handleOpenProfile = (
    tab?: 'orders' | 'messages' | 'profile' | 'wallet' | 'admin-orders' | 'admin-messages'
  ) => {
    setProfileInitialTab(tab);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to Home Page when Logo is clicked as explicitly requested
  const handleGoHome = useCallback(() => {
    setCurrentView('store');
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
      {/* 1. Clean Header: Brand Logo & Name (Returns Home), Cart (السلة), and Profile Hub */}
      <Navbar
        status={cloudStatus}
        user={user}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          if (currentView !== 'store') {
            setCurrentView('store');
          }
          setSearchQuery(q);
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={() => handleOpenProfile()}
        onGoHome={handleGoHome}
      />

      {/* 2. Main Body Content: Dedicated Full Page Profile OR Store */}
      {currentView === 'profile' ? (
        <ProfilePage
          user={user}
          onGoHome={handleGoHome}
          onLogout={() => {
            handleLogout();
            handleGoHome();
          }}
          onLogin={handleLogin}
          onRegister={handleRegister}
          loadingAuth={loadingAuth}
          authError={authError}
          authSuccess={authSuccess}
          initialTab={profileInitialTab}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="space-y-6 sm:space-y-8">
          {/* Hero & Category Quick Navigation */}
          <StoreHero
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            categories={categoriesList}
          />

          {/* VIEW MODE 1: Dedicated Category Page */}
          {selectedCategory !== 'all' ? (
            <DedicatedCategoryView
              categoryId={selectedCategory}
              categoryName={
                categoriesList.find((c) => c.id === selectedCategory)?.name || ''
              }
              categoryIconBg={
                categoriesList.find((c) => c.id === selectedCategory)?.iconBg ||
                'bg-rose-500'
              }
              products={filteredProducts}
              categoriesList={categoriesList}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoHome={handleGoHome}
              onSelectProduct={(prod) => setSelectedProductForModal(prod)}
              onAddToCart={(prod, size, color) =>
                handleAddToCart(prod, size, color, 1)
              }
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
            />
          ) : searchQuery ? (
            /* VIEW MODE 2: Search Results */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Tajawal']">
                    نتائج البحث عن: "{searchQuery}"
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {filteredProducts.length} نتيجة
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-rose-600 hover:underline font-bold self-start sm:self-auto cursor-pointer"
                >
                  إلغاء البحث والعودة لكافة الفئات
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    لم نجد منتجات مطابقة لكلمة "{searchQuery}"
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    جرب البحث بكلمات أخرى أو تصفح الفئات الرئيسية مباشرة.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    عرض جميع الفئات
                  </button>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="bg-gradient-to-b from-white to-slate-50/70 border-2 border-slate-200/90 rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {quadPage + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          نتائج البحث (الصفحة {quadPage + 1} من {totalQuadPages})
                        </span>
                      </div>

                      {/* Quad Navigation Arrows */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={quadPage === 0}
                          onClick={() => setQuadPage((p) => Math.max(0, p - 1))}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                          onClick={() =>
                            setQuadPage((p) => Math.min(totalQuadPages - 1, p + 1))
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="المجموعة التالية"
                        >
                          <span className="hidden sm:inline">التالي</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

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
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 3: Home Page - Multiple Categories in 4*4 Style */
            <div className="space-y-8 sm:space-y-10">
              {/* Instructions & Intro Bar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 font-['Tajawal']">
                    فئات المتجر الرئيسية • أسلوب العرض ٤*٤
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    يعرض كل قسم ٤ منتجات في شاشة واحدة. اضغط زر "صفحة الفئة" للدخول إلى الصفحة المخصصة لكل فئة والتنقل بين صفحاتها.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  {categoriesList.filter((c) => c.id !== 'all').length} فئات رئيسية
                </span>
              </div>

              {/* 1. Men's Category Showcase (4x4) */}
              <CategoryQuadSection
                categoryId="men"
                categoryName="ملابس رجالية فاخرة"
                description="بدل رسمية، هوديات قطنية، قمصان وجينزات كلاسيكية بقصات مريحة"
                iconBg="bg-blue-600"
                products={products.filter((p) => p.category === 'men')}
                onSelectCategoryPage={(catId) => {
                  setSelectedCategory(catId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProduct={(prod) => setSelectedProductForModal(prod)}
                onAddToCart={(prod, size, color) =>
                  handleAddToCart(prod, size, color, 1)
                }
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />

              {/* 2. Women's Category Showcase (4x4) */}
              <CategoryQuadSection
                categoryId="women"
                categoryName="أزياء نسائية أنيقة"
                description="عبايات كريب ملكية، فساتين سهرة، بليزرات عملية وأطقم كاجوال"
                iconBg="bg-pink-600"
                products={products.filter((p) => p.category === 'women')}
                onSelectCategoryPage={(catId) => {
                  setSelectedCategory(catId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProduct={(prod) => setSelectedProductForModal(prod)}
                onAddToCart={(prod, size, color) =>
                  handleAddToCart(prod, size, color, 1)
                }
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />

              {/* 3. Kids Category Showcase (4x4) */}
              <CategoryQuadSection
                categoryId="kids"
                categoryName="ملابس ومستلزمات أطفال"
                description="بيجامات قطنية ناعمة، فساتين ملونة، جاكيتات شتوية وسنيكرز خفيف"
                iconBg="bg-amber-500"
                products={products.filter((p) => p.category === 'kids')}
                onSelectCategoryPage={(catId) => {
                  setSelectedCategory(catId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProduct={(prod) => setSelectedProductForModal(prod)}
                onAddToCart={(prod, size, color) =>
                  handleAddToCart(prod, size, color, 1)
                }
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />

              {/* 4. Accessories Category Showcase (4x4) */}
              <CategoryQuadSection
                categoryId="accessories"
                categoryName="ساعات وإكسسوارات راقية"
                description="ساعات كوارتز مقاومة للماء، نظارات شمسية، أساور وحقائب ظهر متعددة المهام"
                iconBg="bg-purple-600"
                products={products.filter((p) => p.category === 'accessories')}
                onSelectCategoryPage={(catId) => {
                  setSelectedCategory(catId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProduct={(prod) => setSelectedProductForModal(prod)}
                onAddToCart={(prod, size, color) =>
                  handleAddToCart(prod, size, color, 1)
                }
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />

              {/* 5. Shoes & Bags Category Showcase (4x4) */}
              <CategoryQuadSection
                categoryId="shoes"
                categoryName="أحذية وحقائب جلدية"
                description="أحذية جلد طبيعي، صنادل مريحة، كعوب سهرة وحقائب متينة وعملية"
                iconBg="bg-emerald-600"
                products={products.filter((p) => p.category === 'shoes')}
                onSelectCategoryPage={(catId) => {
                  setSelectedCategory(catId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProduct={(prod) => setSelectedProductForModal(prod)}
                onAddToCart={(prod, size, color) =>
                  handleAddToCart(prod, size, color, 1)
                }
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />
            </div>
          )}
        </div>
      </main>
      )}

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
                متجر فهد (FAHAD) للأزياء والإكسسوارات الفاخرة لجميع الفئات، مع نظام نقاط ومكافآت مستمر وتجربة تسوق متكاملة وسلسة.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">فئات المنتجات</h5>
              <ul className="space-y-1 text-[11px] text-slate-500">
                <li
                  className="hover:text-rose-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('men');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ملابس رجالية
                </li>
                <li
                  className="hover:text-rose-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('women');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ملابس نسائية
                </li>
                <li
                  className="hover:text-rose-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('kids');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ملابس أطفال
                </li>
                <li
                  className="hover:text-rose-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('accessories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ساعات وإكسسوارات
                </li>
                <li
                  className="hover:text-rose-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('shoes');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  أحذية وحقائب جلدية
                </li>
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
              <h5 className="font-bold text-slate-900">خدمة العملاء والرسائل</h5>
              <p className="text-[11px] text-slate-500">
                فريق خدمة عملاء متجر فهد جاهز لمساعدتكم والرد على كافة استفساراتكم ومتابعة طلباتكم.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenProfile('messages')}
                  className="text-rose-600 font-bold hover:underline text-xs cursor-pointer text-right flex items-center gap-1"
                >
                  <span>✉️ فتح الرسائل والاستفسارات</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenProfile('profile')}
                  className="text-slate-700 font-bold hover:underline text-xs cursor-pointer text-right"
                >
                  الملف الشخصي والمكافآت
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
        onOpenAuthBar={() => handleOpenProfile('profile')}
        onPointsUpdated={handlePointsUpdated}
        onViewOrdersInProfile={() => handleOpenProfile('orders')}
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
