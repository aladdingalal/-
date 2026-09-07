import { Client, Account, ID, OAuthProvider, Storage } from 'appwrite';
import type {
  CloudConfig,
  UserProfile,
  CloudConnectionStatus,
  CloudFileItem,
  UserRegistrationData,
  LoyaltyPointsRecord,
} from '../types';

export const DEFAULT_CONFIG: CloudConfig = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6a9b9f2a00110d93d685',
  bucketId: 'test-images',
};

const STORAGE_KEY = 'fahad_store_appwrite_config';
const LOCAL_FILES_KEY = 'fahad_store_local_test_files';
const USER_PROFILES_KEY = 'fahad_store_user_profiles_db';
const ACTIVE_USER_KEY = 'fahad_store_active_user_cache';
const POINTS_KEY_PREFIX = 'fahad_store_points_';
const POINTS_HISTORY_PREFIX = 'fahad_store_points_hist_';

// Fallback lookup from previous storage keys if present
function migrateStorageKey(newKey: string, oldKey: string): void {
  try {
    if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal) localStorage.setItem(newKey, oldVal);
    }
  } catch (e) {
    console.warn(e);
  }
}
migrateStorageKey(STORAGE_KEY, 'games_farist_appwrite_config');
migrateStorageKey(LOCAL_FILES_KEY, 'games_farist_local_test_files');
migrateStorageKey(USER_PROFILES_KEY, 'games_farist_user_profiles_db');
migrateStorageKey(ACTIVE_USER_KEY, 'games_farist_active_user_cache');

export function getUserPoints(emailOrId: string): number {
  if (!emailOrId) return 0;
  const key = `${POINTS_KEY_PREFIX}${emailOrId.toLowerCase().trim()}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return parseInt(raw, 10) || 0;
    }
  } catch (e) {
    console.warn(e);
  }
  // New users start with 50 welcome loyalty points!
  return 50;
}

export function addLoyaltyPoints(
  emailOrId: string,
  pointsToAdd: number,
  reason: string = 'عملية شراء من متجر فهد'
): { newTotal: number; earned: number } {
  if (!emailOrId || pointsToAdd <= 0) {
    return { newTotal: getUserPoints(emailOrId), earned: 0 };
  }
  const cleanKey = emailOrId.toLowerCase().trim();
  const current = getUserPoints(cleanKey);
  const updated = current + pointsToAdd;

  try {
    localStorage.setItem(`${POINTS_KEY_PREFIX}${cleanKey}`, updated.toString());

    // Update history log
    const histKey = `${POINTS_HISTORY_PREFIX}${cleanKey}`;
    const rawHist = localStorage.getItem(histKey);
    const history: LoyaltyPointsRecord[] = rawHist ? JSON.parse(rawHist) : [];
    history.unshift({
      id: `pt_${Date.now()}`,
      points: pointsToAdd,
      totalAfter: updated,
      reason,
      date: new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    localStorage.setItem(histKey, JSON.stringify(history.slice(0, 30)));

    // Also update cached active user if matches
    const cachedUser = localStorage.getItem(ACTIVE_USER_KEY);
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      if (parsed.email?.toLowerCase().trim() === cleanKey || parsed.$id === cleanKey) {
        parsed.loyaltyPoints = updated;
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(parsed));
      }
    }
  } catch (e) {
    console.warn('Error saving points:', e);
  }

  return { newTotal: updated, earned: pointsToAdd };
}

export function getPointsHistory(emailOrId: string): LoyaltyPointsRecord[] {
  if (!emailOrId) return [];
  const cleanKey = emailOrId.toLowerCase().trim();
  const histKey = `${POINTS_HISTORY_PREFIX}${cleanKey}`;
  try {
    const rawHist = localStorage.getItem(histKey);
    if (rawHist) {
      return JSON.parse(rawHist);
    }
  } catch (e) {
    console.warn(e);
  }
  return [
    {
      id: 'welcome',
      points: 50,
      totalAfter: 50,
      reason: 'هدية ترحيبية بالانضمام إلى متجر فهد (FAHAD)',
      date: 'عند التسجيل',
    },
  ];
}

export function getSavedUserProfile(email: string): Partial<UserProfile> | null {
  try {
    const raw = localStorage.getItem(USER_PROFILES_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      return db[email.toLowerCase().trim()] || null;
    }
  } catch (e) {
    console.warn(e);
  }
  return null;
}

export function saveUserProfileMeta(email: string, meta: Partial<UserProfile>): void {
  try {
    const raw = localStorage.getItem(USER_PROFILES_KEY);
    const db = raw ? JSON.parse(raw) : {};
    const key = email.toLowerCase().trim();
    db[key] = {
      ...(db[key] || {}),
      ...meta,
    };
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn(e);
  }
}

export function getStoredConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.endpoint && parsed.projectId) {
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to read config from localStorage', e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: CloudConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    clientInstance = null;
    accountInstance = null;
    storageInstance = null;
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function resetStoredConfig(): CloudConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    clientInstance = null;
    accountInstance = null;
    storageInstance = null;
  } catch (e) {
    console.error('Failed to reset config', e);
  }
  return DEFAULT_CONFIG;
}

let clientInstance: Client | null = null;
let accountInstance: Account | null = null;
let storageInstance: Storage | null = null;

export function getAppwriteClient(): Client {
  if (!clientInstance) {
    const config = getStoredConfig();
    clientInstance = new Client();
    clientInstance.setEndpoint(config.endpoint).setProject(config.projectId);
  }
  return clientInstance;
}

export function getAppwriteAccount(): Account {
  if (!accountInstance) {
    accountInstance = new Account(getAppwriteClient());
  }
  return accountInstance;
}

export function getAppwriteStorage(): Storage {
  if (!storageInstance) {
    storageInstance = new Storage(getAppwriteClient());
  }
  return storageInstance;
}

export function getEffectiveBucketId(overrideBucketId?: string): string {
  const config = getStoredConfig();
  return overrideBucketId || config.bucketId || 'test-images';
}

/**
 * Upload an image to Appwrite Cloud Storage
 */
export async function uploadCloudImage(
  file: File,
  customBucketId?: string,
  onProgress?: (percent: number) => void
): Promise<CloudFileItem> {
  const storage = getAppwriteStorage();
  const bucketId = getEffectiveBucketId(customBucketId);
  const fileId = ID.unique();

  try {
    const res = await storage.createFile(
      bucketId,
      fileId,
      file,
      undefined,
      (progress) => {
        if (onProgress && typeof progress.progress === 'number') {
          onProgress(Math.round(progress.progress));
        }
      }
    );

    const viewUrl = storage.getFileView(bucketId, res.$id).toString();
    const previewUrl = storage.getFilePreview(bucketId, res.$id, 600, 600).toString();

    const cloudFile: CloudFileItem = {
      $id: res.$id,
      name: res.name || file.name,
      sizeOriginal: res.sizeOriginal || file.size,
      mimeType: res.mimeType || file.type,
      $createdAt: res.$createdAt || new Date().toISOString(),
      bucketId: res.bucketId || bucketId,
      viewUrl,
      previewUrl,
      isLocalMock: false,
    };

    // Also persist in local record list for reference
    saveLocalRecordedFile(cloudFile);
    return cloudFile;
  } catch (err: any) {
    console.error('Appwrite Storage Upload Error:', err);
    throw err;
  }
}

/**
 * List files in cloud storage
 */
export async function listCloudImages(customBucketId?: string): Promise<CloudFileItem[]> {
  const storage = getAppwriteStorage();
  const bucketId = getEffectiveBucketId(customBucketId);

  try {
    const res = await storage.listFiles(bucketId);
    return res.files.map((f: any) => {
      const viewUrl = storage.getFileView(bucketId, f.$id).toString();
      const previewUrl = storage.getFilePreview(bucketId, f.$id, 600, 600).toString();
      return {
        $id: f.$id,
        name: f.name,
        sizeOriginal: f.sizeOriginal,
        mimeType: f.mimeType,
        $createdAt: f.$createdAt,
        bucketId: f.bucketId,
        viewUrl,
        previewUrl,
        isLocalMock: false,
      };
    });
  } catch (err: any) {
    console.warn('Could not list files from Appwrite bucket, returning locally recorded tests:', err);
    // Return cached/local test files so user is never blocked
    return getLocalRecordedFiles();
  }
}

/**
 * Delete a file from Cloud Storage
 */
export async function deleteCloudImage(fileId: string, customBucketId?: string): Promise<void> {
  const storage = getAppwriteStorage();
  const bucketId = getEffectiveBucketId(customBucketId);

  try {
    await storage.deleteFile(bucketId, fileId);
  } catch (err) {
    console.warn('Cloud file delete error (might be local demo item):', err);
  }
  removeLocalRecordedFile(fileId);
}

// Local File Tracker for preview & offline resilience
function getLocalRecordedFiles(): CloudFileItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_FILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return [];
}

function saveLocalRecordedFile(item: CloudFileItem): void {
  try {
    const existing = getLocalRecordedFiles().filter((f) => f.$id !== item.$id);
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify([item, ...existing]));
  } catch (e) {
    console.warn(e);
  }
}

function removeLocalRecordedFile(fileId: string): void {
  try {
    const existing = getLocalRecordedFiles().filter((f) => f.$id !== fileId);
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn(e);
  }
}

export function saveDemoTestFile(file: File): Promise<CloudFileItem> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fakeId = 'local_test_' + Math.random().toString(36).substring(2, 9);
      const item: CloudFileItem = {
        $id: fakeId,
        name: file.name,
        sizeOriginal: file.size,
        mimeType: file.type || 'image/jpeg',
        $createdAt: new Date().toISOString(),
        bucketId: 'demo-local-bucket',
        viewUrl: dataUrl,
        previewUrl: dataUrl,
        isLocalMock: true,
      };
      saveLocalRecordedFile(item);
      resolve(item);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Ping the cloud service to measure latency and test connectivity
 */
export async function testCloudConnection(): Promise<CloudConnectionStatus> {
  const config = getStoredConfig();
  const startTime = performance.now();

  try {
    // We ping the locale endpoint which is public on Appwrite
    const response = await fetch(`${config.endpoint}/locale`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': config.projectId,
      },
    });

    const latency = Math.round(performance.now() - startTime);

    if (response.ok || response.status === 401 || response.status === 403) {
      // 200 or 401/403 means server responded and projectId header was processed
      return {
        state: 'connected',
        message: 'متصل بالسحابة بنجاح',
        latencyMs: latency,
      };
    } else {
      return {
        state: 'error',
        message: `استجابة السحابة (${response.status}): يرجى التأكد من معرف المشروع`,
        latencyMs: latency,
      };
    }
  } catch (error: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      state: 'error',
      message: error?.message || 'تعذر الاتصال بخادم السحابة، تأكد من اتصال الإنترنت أو إعدادات CORS',
      latencyMs: latency,
    };
  }
}

/**
 * Register a new user with extended profile data
 */
export async function registerNewUser(
  name: string,
  email: string,
  pass: string,
  extraData?: {
    phone?: string;
    residenceCountry?: string;
    currentCity?: string;
    detailedAddress?: string;
  }
): Promise<UserProfile> {
  const account = getAppwriteAccount();
  const uniqueId = ID.unique();
  const cleanEmail = email.toLowerCase().trim();

  let user: any;
  try {
    user = await account.create(uniqueId, cleanEmail, pass, name.trim());
  } catch (err) {
    throw err;
  }

  const profile: UserProfile = {
    $id: user.$id || uniqueId,
    name: name.trim(),
    email: cleanEmail,
    registration: new Date().toISOString(),
    status: true,
    emailVerification: false,
    phone: extraData?.phone?.trim() || '',
    residenceCountry: extraData?.residenceCountry?.trim() || '',
    currentCity: extraData?.currentCity?.trim() || '',
    detailedAddress: extraData?.detailedAddress?.trim() || '',
    loyaltyPoints: getUserPoints(cleanEmail),
  };

  // Save metadata
  saveUserProfileMeta(cleanEmail, profile);
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(profile));

  // Automatically log in to establish session
  try {
    await account.createEmailPasswordSession(cleanEmail, pass);
  } catch (loginErr) {
    console.warn('Auto login after registration notification:', loginErr);
  }

  return profile;
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const account = getAppwriteAccount();
  const cleanEmail = email.toLowerCase().trim();
  
  await account.createEmailPasswordSession(cleanEmail, pass);
  
  // Retrieve account
  const appwriteUser = await account.get();
  const savedMeta = getSavedUserProfile(cleanEmail) || {};
  
  const userProfile: UserProfile = {
    $id: appwriteUser.$id,
    name: appwriteUser.name || savedMeta.name || cleanEmail.split('@')[0],
    email: appwriteUser.email || cleanEmail,
    registration: appwriteUser.registration || savedMeta.registration || new Date().toISOString(),
    status: appwriteUser.status ?? true,
    emailVerification: appwriteUser.emailVerification ?? false,
    phone: savedMeta.phone || appwriteUser.phone || '',
    residenceCountry: savedMeta.residenceCountry || '',
    currentCity: savedMeta.currentCity || '',
    detailedAddress: savedMeta.detailedAddress || '',
    loyaltyPoints: getUserPoints(cleanEmail),
  };

  saveUserProfileMeta(cleanEmail, userProfile);
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(userProfile));
  return userProfile;
}

/**
 * Check if active session exists
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const account = getAppwriteAccount();
    const user = await account.get();
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const savedMeta = getSavedUserProfile(cleanEmail) || {};

    const profile: UserProfile = {
      $id: user.$id,
      name: user.name || savedMeta.name || 'مستخدم مسجل',
      email: user.email,
      registration: user.registration,
      status: user.status,
      emailVerification: user.emailVerification,
      phone: savedMeta.phone || user.phone || '',
      residenceCountry: savedMeta.residenceCountry || '',
      currentCity: savedMeta.currentCity || '',
      detailedAddress: savedMeta.detailedAddress || '',
      accessedAt: user.accessedAt,
      loyaltyPoints: getUserPoints(cleanEmail),
    };
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(profile));
    return profile;
  } catch (err: any) {
    // Check if there is cached active user profile
    try {
      const cached = localStorage.getItem(ACTIVE_USER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.email) {
          parsed.loyaltyPoints = getUserPoints(parsed.email);
        }
        return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return null;
  }
}

/**
 * Sign out current session
 */
export async function logoutCurrentSession(): Promise<void> {
  try {
    const account = getAppwriteAccount();
    await account.deleteSession('current');
  } catch (err) {
    console.warn('Logout warning:', err);
  }
  localStorage.removeItem(ACTIVE_USER_KEY);
}

/**
 * Translate common Appwrite error codes to clear Arabic explanations
 */
export function translateAppwriteError(error: any): { text: string; hint?: string } {
  if (!error) return { text: 'حدث خطأ غير متوقع' };
  
  const msg = (error.message || '').toLowerCase();
  const code = error.code;
  const type = (error.type || '').toLowerCase();

  if (type.includes('user_already_exists') || msg.includes('already exists')) {
    return {
      text: 'البريد الإلكتروني مسجل مسبقاً في النظام',
      hint: 'يمكنك التبديل إلى تبويب تسجيل الدخول واستخدام بريدك وكلمة المرور.',
    };
  }

  if (type.includes('user_invalid_credentials') || msg.includes('invalid credentials') || msg.includes('invalid credentials')) {
    return {
      text: 'بيانات الاعتماد غير صحيحة (البريد الإلكتروني أو كلمة المرور خاطئة)',
      hint: 'يرجى التأكد من كتابة البريد وكلمة المرور بدقة، أو إنشاء حساب جديد إذا لم تكن مسجلاً بعد.',
    };
  }

  if (type.includes('password_recently_used') || msg.includes('password must be between 8 and 256')) {
    return {
      text: 'كلمة المرور يجب ألا تقل عن 8 أحرف',
      hint: 'اختر كلمة مرور قوية مكونة من 8 أحرف أو أكثر لحماية حسابك.',
    };
  }

  if (type.includes('user_blocked') || msg.includes('blocked')) {
    return {
      text: 'هذا الحساب محظور مؤقتاً',
      hint: 'يرجى التواصل مع إدارة الموقع أو مراجعة لوحة تحكم Appwrite.',
    };
  }

  if (type.includes('rate_limit') || code === 429) {
    return {
      text: 'تم تجاوز الحد الأقصى للمحاولات',
      hint: 'يرجى الانتظار دقيقة واحدة ثم إعادة المحاولة مرة أخرى.',
    };
  }

  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('cors')) {
    return {
      text: 'خطأ في الاتصال بالشبكة أو إعدادات النطاق (CORS)',
      hint: 'يرجى إضافة نطاق التطبيق الحالي إلى قائمة Web Platforms في لوحة تحكم Appwrite لمشروعك.',
    };
  }

  if (msg.includes('oauth') || msg.includes('provider disabled') || msg.includes('not configured')) {
    return {
      text: 'خدمة تسجيل الدخول بواسطة الحساب الاجتماعي غير مفعلة في لوحة تحكم Appwrite',
      hint: 'لتفعيلها، انتقل إلى Appwrite Console > Auth > Settings > Providers وقم بتفعيل المزود.',
    };
  }

  return {
    text: error.message || 'حدث خطأ أثناء الاتصال بالسحابة',
    hint: code ? `رمز الخطأ: ${code}` : undefined,
  };
}

export { OAuthProvider };
