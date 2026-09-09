import React from 'react';
import { Phone } from 'lucide-react';

export type WaLinkVariant = 'emerald' | 'brand';

export interface WaLinkButtonProps {
  href: string;
  variant?: WaLinkVariant;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 font-bold text-white transition-[background-color,color,transform,box-shadow,border-color] active:scale-95';

const VARIANT_CLASS: Record<WaLinkVariant, string> = {
  emerald:
    'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25',
  brand:
    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25',
};

/** Tombol / tautan CTA ke WhatsApp dengan varian warna konsisten. */
export const WaLinkButton: React.FC<WaLinkButtonProps> = ({
  href,
  variant = 'emerald',
  className = '',
  icon = <Phone className="w-4 h-4" />,
  children,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${className}`}
  >
    {icon}
    <span>{children}</span>
  </a>
);