export interface CloudConfig {
  endpoint: string;
  projectId: string;
}

export interface UserProfile {
  $id: string;
  name: string;
  email: string;
  registration: string;
  status: boolean;
  emailVerification: boolean;
  phone?: string;
  accessedAt?: string;
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
