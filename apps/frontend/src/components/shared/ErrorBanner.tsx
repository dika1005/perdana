import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs font-bold shrink-0 underline underline-offset-2 cursor-pointer hover:opacity-80"
      >
        <RefreshCw className="w-3 h-3" />
        Coba lagi
      </button>
    )}
  </div>
);
