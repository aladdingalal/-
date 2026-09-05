import React from 'react';
import { Loader2 } from 'lucide-react';

interface SocialAuthButtonsProps {
  onSocialLogin: (provider: string, providerNameAr: string) => void;
  loadingProvider: string | null;
  disabled?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSocialLogin,
  loadingProvider,
  disabled,
}) => {
  const providers = [
    {
      id: 'google',
      name: 'Google',
      nameAr: 'جوجل',
      bgColor: 'hover:bg-slate-800 hover:border-slate-600 bg-slate-900/90',
      textColor: 'text-slate-200',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      ),
    },
    {
      id: 'discord',
      name: 'Discord',
      nameAr: 'ديسكورد',
      bgColor: 'hover:bg-[#5865F2]/20 hover:border-[#5865F2]/60 bg-slate-900/90',
      textColor: 'text-[#858df8]',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0 text-[#5865F2]" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      id: 'github',
      name: 'GitHub',
      nameAr: 'جيت هَب',
      bgColor: 'hover:bg-slate-800 hover:border-slate-600 bg-slate-900/90',
      textColor: 'text-slate-200',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0 text-white" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      nameAr: 'فيسبوك',
      bgColor: 'hover:bg-[#1877F2]/20 hover:border-[#1877F2]/60 bg-slate-900/90',
      textColor: 'text-[#4595fa]',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0 text-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'apple',
      name: 'Apple',
      nameAr: 'أبل',
      bgColor: 'hover:bg-slate-800 hover:border-slate-600 bg-slate-900/90',
      textColor: 'text-slate-200',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0 text-white" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* 2-columns on mobile and tablet for optimal ergonomics */}
      <div className="grid grid-cols-2 gap-2.5">
        {providers.map((p) => {
          const isLoading = loadingProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled || !!loadingProvider}
              onClick={() => onSocialLogin(p.id, p.nameAr)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-700/70 text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${p.bgColor} ${p.textColor}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              ) : (
                p.icon
              )}
              <span>{p.nameAr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
