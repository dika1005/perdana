import React from 'react';

export type AmbientGlowVariant = 'landing' | 'auth';

export interface AmbientGlowProps {
  variant?: AmbientGlowVariant;
}

const LANDING_GLOWS = (
  <>
    <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.06] rounded-full blur-[150px]" />
    <div className="absolute bottom-0 -right-48 w-[550px] h-[550px] bg-cyan-500/[0.04] dark:bg-cyan-600/[0.05] rounded-full blur-[150px]" />
  </>
);

const AUTH_GLOWS = (
  <>
    <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/[0.04] dark:bg-blue-500/[0.06] rounded-full blur-3xl" />
    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-3xl" />
  </>
);

/**
 * Background dekoratif statis (tidak dianimasikan) untuk halaman publik.
 * - `landing`: landing page katalog.
 * - `auth`: halaman login / autentikasi.
 */
export const AmbientGlow: React.FC<AmbientGlowProps> = ({ variant = 'landing' }) => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    {variant === 'auth' ? AUTH_GLOWS : LANDING_GLOWS}
  </div>
);