import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface BackLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

/** Tautan "kembali ke beranda" dengan ikon panah. */
export const BackLink: React.FC<BackLinkProps> = ({
  href = '/',
  label = 'Kembali ke Beranda',
  className = '',
}) => (
  <Link href={href} className={`flex items-center gap-2 ${className}`}>
    <ArrowLeft className="w-4 h-4" />
    <span>{label}</span>
  </Link>
);