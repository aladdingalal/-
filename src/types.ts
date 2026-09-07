export interface CloudConfig {
  endpoint: string;
  projectId: string;
  bucketId?: string;
  apiKey?: string;
}

export interface CustomerMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  isCloudSaved: boolean;
  fileId?: string;
}

export interface CloudFileItem {
  $id: string;
  name: string;
  sizeOriginal: number;
  mimeType: string;
  $createdAt: string;
  bucketId: string;
  viewUrl: string;
  previewUrl: string;
  isLocalMock?: boolean;
}

export interface LoyaltyPointsRecord {
  id: string;
  points: number;
  totalAfter: number;
  reason: string;
  date: string;
}

export interface UserProfile {
  $id: string;
  name: string;
  email: string;
  registration: string;
  status: boolean;
  emailVerification: boolean;
  phone?: string;
  residenceCountry?: string; // بلد الإقامة
  currentCity?: string; // المدينة الحالية
  detailedAddress?: string; // العنوان التفصيلي
  accessedAt?: string;
  loyaltyPoints?: number; // نقاط المكافآت والولاء مع كل عملية شراء
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  residenceCountry: string;
  currentCity: string;
  detailedAddress: string;
}

export type ProductCategory = 'all' | 'men' | 'women' | 'kids' | 'accessories' | 'shoes';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryName: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  sizes: string[];
  colors: ProductColor[];
  tag?: string;
  tagColor?: string;
  inStock: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface CloudSession {
  $id: string;
  userId: string;
  expire: string;
  provider: string;
  providerUid?: string;
  ip?: string;
  osName?: string;
  clientName?: string;
  current: boolean;
}

export type AuthMode = 'login' | 'register';

export type SocialProvider = 'google' | 'discord' | 'github' | 'facebook' | 'apple';

export interface SocialProviderConfig {
  id: SocialProvider;
  nameAr: string;
  nameEn: string;
  icon: string;
  colorClass: string;
  bgHoverClass: string;
  providerKey: string;
}

export interface CloudConnectionStatus {
  state: 'checking' | 'connected' | 'error' | 'idle';
  message: string;
  latencyMs?: number;
}
