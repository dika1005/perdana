'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg';

const MAX_WIDTH_CLASS: Record<ModalMaxWidth, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: ModalMaxWidth;
  zIndex?: number;
  closeOnOutsideClick?: boolean;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'sm',
  zIndex = 50,
  closeOnOutsideClick = true,
  footer,
  onSubmit,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const panel = (
    <>
      <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-border-main">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text-main">{title}</h2>
            {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar max-h-[65vh]">{children}</div>

      {footer && <div className="flex gap-2.5 mt-5 pt-4 border-t border-border-main">{footer}</div>}
    </>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
      onMouseDown={e => {
        if (closeOnOutsideClick && e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form
          onSubmit={onSubmit}
          className={`skeuo bg-bg-skeuo w-full ${MAX_WIDTH_CLASS[maxWidth]} p-6 sm:p-7`}
        >
          {panel}
        </form>
      ) : (
        <div className={`skeuo bg-bg-skeuo w-full ${MAX_WIDTH_CLASS[maxWidth]} p-6 sm:p-7`}>
          {panel}
        </div>
      )}
    </div>
  );
};
