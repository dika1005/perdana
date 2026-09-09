import React from 'react';

export type AmbientGlowVariant = 'landing' | 'auth';

export interface AmbientGlowProps {
  variant?: AmbientGlowVariant;
}

const LANDING_GLOWS = (
  <>
    <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-[150px]" />
    <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[150px]" />
    <div className="absolute bottom-10 left-1/4 w-[650px] h-[650px] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[160px]" />
  </>
);

const AUTH_GLOWS = (
  <>
    <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl" />
    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/[0.04] dark:bg-purple-500/[0.06] rounded-full blur-3xl" />
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