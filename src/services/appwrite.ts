import { Client, Account, ID, OAuthProvider } from 'appwrite';
import type { CloudConfig, UserProfile, CloudConnectionStatus } from '../types';

export const DEFAULT_CONFIG: CloudConfig = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6a9b9f2a00110d93d685',
};

const STORAGE_KEY = 'games_farist_appwrite_config';

export function getStoredConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.endpoint && parsed.projectId) {
        return parsed;
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
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function resetStoredConfig(): CloudConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    clientInstance = null;
    accountInstance = null;
  } catch (e) {
    console.error('Failed to reset config', e);
  }
  return DEFAULT_CONFIG;
}

let clientInstance: Client | null = null;
let accountInstance: Account | null = null;

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
 * Register a new user
 */
export async function registerNewUser(name: string, email: string, pass: string): Promise<UserProfile> {
  const account = getAppwriteAccount();
  const uniqueId = ID.unique();
  const user = await account.create(uniqueId, email, pass, name);
  return user as unknown as UserProfile;
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string) {
  const account = getAppwriteAccount();
  return await account.createEmailPasswordSession(email, pass);
}

/**
 * Social OAuth login
 */
export function startOAuthLogin(provider: string) {
  const account = getAppwriteAccount();
  const currentUrl = window.location.href.split('#')[0];
  
  // Appwrite OAuth redirect
  return account.createOAuth2Session(
    provider as any,
    currentUrl, // redirect back here on success
    currentUrl  // redirect back here on failure
  );
}

/**
 * Check if active session exists
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const account = getAppwriteAccount();
    const user = await account.get();
    return user as unknown as UserProfile;
  } catch (err: any) {
    // Not logged in or session expired
    return null;
  }
}

/**
 * Sign out current session
 */
export async function logoutCurrentSession(): Promise<void> {
  const account = getAppwriteAccount();
  await account.deleteSession('current');
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
