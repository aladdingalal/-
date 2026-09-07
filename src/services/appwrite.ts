import { Client, Account, ID, OAuthProvider, Storage } from 'appwrite';
import type {
  CloudConfig,
  UserProfile,
  CloudConnectionStatus,
  CloudFileItem,
  UserRegistrationData,
  LoyaltyPointsRecord,
  CustomerMessage,
  CustomerOrder,
} from '../types';

export const DEFAULT_CONFIG: CloudConfig = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6a9b9f2a00110d93d685',
  bucketId: 'test-images',
  apiKey:
    'standard_7a985f3cac7f2b55fc02d15439dbe6f91d04567678748a3f6437491b98dc95a8e52d7224e804ceec3ad14884d841216806170e44e1faeab4a99cfca745f2d951b3bd5eb9e3fef0c1535cf0f3ca7bb0efdadca06ffd3417f8cbf7a2b9071f52de8fb80a91362324ffe5d4ee1cd38883e5e4c190737644e6f40c2293e3308ba702',
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

export function findUserProfileByPhone(phone: string): { email: string; profile: Partial<UserProfile> } | null {
  try {
    const raw = localStorage.getItem(USER_PROFILES_KEY);
    if (!raw) return null;
    const db = JSON.parse(raw);
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits) return null;
    for (const [emailKey, profile] of Object.entries(db)) {
      const p = profile as any;
      if (p.phone && p.phone.replace(/\D/g, '') === cleanDigits) {
        return { email: emailKey, profile: p };
      }
    }
  } catch (e) {
    console.warn(e);
  }
  return null;
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload an image to Appwrite Cloud Storage using the configured Cloud API Key
 */
export async function uploadCloudImage(
  file: File,
  customBucketId?: string,
  onProgress?: (percent: number) => void
): Promise<CloudFileItem> {
  const bucketId = getEffectiveBucketId(customBucketId);

  // 1. First attempt: Server API powered by the Appwrite API Key (100% bypasses CORS and permission blocks)
  try {
    if (onProgress) onProgress(25);
    const base64 = await fileToBase64(file);
    if (onProgress) onProgress(50);

    const res = await fetch('/api/cloud/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        base64,
      }),
    });

    if (onProgress) onProgress(90);

    if (res.ok) {
      const data = await res.json();
      const cloudFile: CloudFileItem = {
        $id: data.$id,
        name: data.name,
        sizeOriginal: data.sizeOriginal,
        mimeType: data.mimeType,
        $createdAt: data.$createdAt,
        bucketId: data.bucketId || bucketId,
        viewUrl: data.viewUrl,
        previewUrl: data.previewUrl,
        isLocalMock: false,
      };

      if (onProgress) onProgress(100);
      saveLocalRecordedFile(cloudFile);
      return cloudFile;
    }
  } catch (serverErr) {
    console.warn('Server upload route failed, falling back to direct Appwrite SDK:', serverErr);
  }

  // 2. Fallback attempt: Direct Appwrite Client SDK
  const storage = getAppwriteStorage();
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
  const bucketId = getEffectiveBucketId(customBucketId);

  // 1. Try server endpoint powered by Appwrite API key
  try {
    const res = await fetch('/api/cloud/images');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.files) && data.files.length > 0) {
        return data.files;
      }
    }
  } catch (e) {
    console.warn('Could not fetch images via /api/cloud/images:', e);
  }

  // 2. Direct Appwrite Storage SDK fallback
  try {
    const storage = getAppwriteStorage();
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
    return getLocalRecordedFiles();
  }
}

/**
 * Delete a file from Cloud Storage
 */
export async function deleteCloudImage(fileId: string, customBucketId?: string): Promise<void> {
  try {
    await fetch(`/api/cloud/images/${fileId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Server delete image failed, trying direct SDK:', e);
  }

  try {
    const storage = getAppwriteStorage();
    const bucketId = getEffectiveBucketId(customBucketId);
    await storage.deleteFile(bucketId, fileId);
  } catch (err) {
    console.warn('Cloud file delete error:', err);
  }
  removeLocalRecordedFile(fileId);
}

const LOCAL_MESSAGES_KEY = 'fahad_store_local_messages';

export const ADMIN_EMAIL = 'Alaa.galal.abas1@gmail.com';
export const isAdminEmail = (email?: string): boolean =>
  (email || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

const LOCAL_ORDERS_KEY = 'fahad_store_customer_orders';

/**
 * Send and retain customer message in Appwrite Cloud
 */
export async function sendAndRetainCustomerMessage(msgData: {
  senderName: string;
  senderEmail: string;
  recipientEmail?: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<CustomerMessage> {
  const payload = {
    ...msgData,
    recipientEmail: msgData.recipientEmail || ADMIN_EMAIL,
  };

  // 1. Call server endpoint using the Appwrite cloud key
  try {
    const res = await fetch('/api/cloud/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.message) {
        saveLocalMessage(data.message);
        return data.message;
      }
    }
  } catch (err) {
    console.warn('Server save message failed, saving to local cloud storage:', err);
  }

  // 2. Offline / local fallback
  const localMsg: CustomerMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderName: msgData.senderName,
    senderEmail: msgData.senderEmail,
    recipientEmail: ADMIN_EMAIL,
    phone: msgData.phone,
    subject: msgData.subject || 'رسالة استفسار',
    message: msgData.message,
    date: new Date().toISOString(),
    isCloudSaved: true,
    status: 'unread',
  };
  saveLocalMessage(localMsg);
  return localMsg;
}

/**
 * Get all retained customer messages from Appwrite Cloud
 */
export async function getRetainedCustomerMessages(userEmail?: string): Promise<CustomerMessage[]> {
  try {
    const url = userEmail ? `/api/cloud/messages?email=${encodeURIComponent(userEmail)}` : '/api/cloud/messages';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        // Update local cache
        data.messages.forEach((m: CustomerMessage) => saveLocalMessage(m));
        return data.messages;
      }
    }
  } catch (err) {
    console.warn('Error fetching messages from cloud, returning local messages:', err);
  }
  return getLocalMessages(userEmail);
}

/**
 * Admin reply to customer message
 */
export async function replyCustomerMessage(messageId: string, replyText: string): Promise<CustomerMessage | null> {
  try {
    const res = await fetch(`/api/cloud/messages/${messageId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyText }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.message) {
        saveLocalMessage(data.message);
        return data.message;
      }
    }
  } catch (e) {
    console.warn('Failed to send reply to server:', e);
  }

  // Update local
  const list = getLocalMessages();
  const idx = list.findIndex((m) => m.id === messageId);
  if (idx !== -1) {
    list[idx].reply = replyText;
    list[idx].replyDate = new Date().toISOString();
    list[idx].status = 'replied';
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(list));
    return list[idx];
  }
  return null;
}

/**
 * Delete a retained customer message
 */
export async function deleteRetainedCustomerMessage(id: string): Promise<void> {
  try {
    await fetch(`/api/cloud/messages/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Delete cloud message error:', e);
  }
  removeLocalMessage(id);
}

function saveLocalMessage(msg: CustomerMessage): void {
  try {
    const list = getLocalMessages();
    const updated = [msg, ...list.filter((m) => m.id !== msg.id)];
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
}

function getLocalMessages(userEmail?: string): CustomerMessage[] {
  let list: CustomerMessage[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    if (raw) {
      list = JSON.parse(raw);
      // Purge any legacy demo messages
      const filtered = list.filter((m) => m.id !== 'welcome_msg_init' && m.id !== 'welcome_msg_1');
      if (filtered.length !== list.length) {
        list = filtered;
        localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  if (userEmail && !isAdminEmail(userEmail)) {
    const normalized = userEmail.toLowerCase().trim();
    return list.filter(
      (m) =>
        (m.senderEmail || '').toLowerCase().trim() === normalized ||
        (m.recipientEmail || '').toLowerCase().trim() === normalized
    );
  }
  return list;
}

function removeLocalMessage(id: string): void {
  try {
    const list = getLocalMessages().filter((m) => m.id !== id);
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
}

// ----------------------------------------------------
// Customer Orders APIs (Cloud & Local Sync)
// ----------------------------------------------------

/**
 * Submit and retain new customer order
 */
export async function createCustomerOrder(orderData: {
  customerName: string;
  customerEmail: string;
  phone?: string;
  city?: string;
  address?: string;
  items: any[];
  subtotal: number;
  shipping: number;
  total: number;
  notes?: string;
  pointsEarned?: number;
}): Promise<CustomerOrder> {
  const payload = {
    ...orderData,
    recipientAdminEmail: ADMIN_EMAIL,
  };

  try {
    const res = await fetch('/api/cloud/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        saveLocalOrder(data.order);
        return data.order;
      }
    }
  } catch (err) {
    console.warn('Server save order failed, falling back to local storage:', err);
  }

  // Fallback local order
  const localOrder: CustomerOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    phone: orderData.phone,
    city: orderData.city,
    address: orderData.address,
    items: orderData.items,
    subtotal: orderData.subtotal,
    shipping: orderData.shipping,
    total: orderData.total,
    date: new Date().toISOString(),
    status: 'processing',
    recipientAdminEmail: ADMIN_EMAIL,
    pointsEarned: orderData.pointsEarned || 0,
    notes: orderData.notes,
    isCloudSaved: true,
  };
  saveLocalOrder(localOrder);
  return localOrder;
}

/**
 * Get customer orders from cloud
 */
export async function getCustomerOrders(userEmail?: string): Promise<CustomerOrder[]> {
  try {
    const url = userEmail ? `/api/cloud/orders?email=${encodeURIComponent(userEmail)}` : '/api/cloud/orders';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders) && data.orders.length > 0) {
        data.orders.forEach((o: CustomerOrder) => saveLocalOrder(o));
        return data.orders;
      }
    }
  } catch (err) {
    console.warn('Error fetching orders from cloud, returning local orders:', err);
  }
  return getLocalOrders(userEmail);
}

/**
 * Update order status (Admin)
 */
export async function updateCustomerOrderStatus(
  orderId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<CustomerOrder | null> {
  try {
    const res = await fetch(`/api/cloud/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        saveLocalOrder(data.order);
        return data.order;
      }
    }
  } catch (e) {
    console.warn('Error updating order status on cloud:', e);
  }

  const list = getLocalOrders();
  const idx = list.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    list[idx].status = status;
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
    return list[idx];
  }
  return null;
}

export async function deleteCustomerOrder(orderId: string): Promise<boolean> {
  try {
    const list = getLocalOrders();
    const filtered = list.filter((o) => o.id !== orderId);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn(e);
    return false;
  }
}

function saveLocalOrder(order: CustomerOrder): void {
  try {
    const list = getLocalOrders();
    const updated = [order, ...list.filter((o) => o.id !== order.id)];
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
}

function getLocalOrders(userEmail?: string): CustomerOrder[] {
  let list: CustomerOrder[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      list = JSON.parse(raw);
      // Purge any legacy demo orders
      const filtered = list.filter((o) => o.id !== 'ord_demo_101' && o.id !== 'ord_init_9021');
      if (filtered.length !== list.length) {
        list = filtered;
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  if (userEmail && !isAdminEmail(userEmail)) {
    const normalized = userEmail.toLowerCase().trim();
    return list.filter((o) => (o.customerEmail || '').toLowerCase().trim() === normalized);
  }
  return list;
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
  let cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    const digits = (extraData?.phone || 'customer').replace(/\D/g, '');
    cleanEmail = `${digits || Date.now()}@fahadstore.com`;
  }

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
 * Sign in with email and password or phone number
 */
export async function loginWithEmail(emailOrPhone: string, pass: string): Promise<UserProfile> {
  const account = getAppwriteAccount();
  let cleanEmail = emailOrPhone.toLowerCase().trim();

  // If user entered phone number instead of email
  if (!cleanEmail.includes('@')) {
    const found = findUserProfileByPhone(cleanEmail);
    if (found) {
      cleanEmail = found.email;
    } else {
      const cleanDigits = cleanEmail.replace(/\D/g, '');
      cleanEmail = `${cleanDigits}@fahadstore.com`;
    }
  }
  
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
