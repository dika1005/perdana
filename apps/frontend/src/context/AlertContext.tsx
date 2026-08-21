'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle, 
  X
} from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'danger';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: AlertType;
  duration?: number;
}

interface AlertContextValue {
  showAlert: (options: string | AlertOptions) => Promise<void>;
  showConfirm: (options: string | ConfirmOptions) => Promise<boolean>;
  showToast: (message: string, type?: AlertType, duration?: number) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    isConfirm: boolean;
    title?: string;
    message: string;
    type: AlertType;
    confirmText: string;
    cancelText?: string;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    isConfirm: false,
    message: '',
    type: 'info',
    confirmText: 'OK',
  });

  // Toasts State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showAlert = useCallback((options: string | AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      const opts: AlertOptions = typeof options === 'string' ? { message: options } : options;
      setModalState({
        isOpen: true,
        isConfirm: false,
        title: opts.title || (opts.type === 'error' ? 'Terjadi Kesalahan' : opts.type === 'success' ? 'Berhasil' : opts.type === 'warning' ? 'Perhatian' : 'Informasi'),
        message: opts.message,
        type: opts.type || (opts.type ? opts.type : 'info'),
        confirmText: opts.confirmText || 'Mengerti',
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((options: string | ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
      setModalState({
        isOpen: true,
        isConfirm: true,
        title: opts.title || 'Konfirmasi Tindakan',
        message: opts.message,
        type: opts.type || 'warning',
        confirmText: opts.confirmText || 'Ya, Lanjutkan',
        cancelText: opts.cancelText || 'Batal',
        resolve: (val: boolean) => resolve(val),
      });
    });
  }, []);

  const showToast = useCallback((message: string, type: AlertType = 'success', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const handleCloseModal = (confirmed: boolean) => {
    if (modalState.resolve) {
      modalState.resolve(confirmed);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Type-specific icon and style resolver
  const getTypeConfig = (type: AlertType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          accentBorder: 'border-emerald-500/30',
        };
      case 'danger':
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-rose-600 dark:text-rose-400',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-800/60',
          btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
          accentBorder: 'border-rose-500/30',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/60',
          btnColor: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
          accentBorder: 'border-amber-500/30',
        };
      case 'info':
      default:
        return {
          icon: HelpCircle,
          iconColor: 'text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-800/60',
          btnColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
          accentBorder: 'border-blue-500/30',
        };
    }
  };

  const currentConfig = getTypeConfig(modalState.type);
  const ModalIcon = currentConfig.icon;

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}

      {/* Modern Skeuomorphic Alert / Confirm Modal Dialog */}
      {modalState.isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !modalState.isConfirm) {
              handleCloseModal(true);
            }
          }}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 relative skeuo overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              modalState.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              modalState.type === 'error' || modalState.type === 'danger' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
              modalState.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`} />

            {/* Header Icon + Title */}
            <div className="flex items-start gap-4 mb-4 pt-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${currentConfig.badgeBg} ${currentConfig.accentBorder} shadow-sm`}>
                <ModalIcon className={`w-6 h-6 ${currentConfig.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                  {modalState.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-line break-words">
                  {modalState.message}
                </p>
              </div>
              {!modalState.isConfirm && (
                <button
                  type="button"
                  onClick={() => handleCloseModal(true)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80">
              {modalState.isConfirm && (
                <button
                  type="button"
                  onClick={() => handleCloseModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold skeuo-button text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
                >
                  {modalState.cancelText || 'Batal'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCloseModal(true)}
                autoFocus
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] text-center ${currentConfig.btnColor}`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const cfg = getTypeConfig(toast.type);
          const ToastIcon = cfg.icon;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl flex items-center gap-3 skeuo animate-in slide-in-from-bottom-3 duration-200"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${cfg.badgeBg}`}>
                <ToastIcon className={`w-4 h-4 ${cfg.iconColor}`} />
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1 leading-snug break-words">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
};
