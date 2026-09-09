import React from 'react';

export type SectionHeadingAlign = 'left' | 'center';

export interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  description?: string;
  align?: SectionHeadingAlign;
  className?: string;
}

/** Header seksi konsisten: pill kecil (opsional) + judul + deskripsi. */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  align = 'left',
  className = '',
}) => (
  <div className={`${align === 'center' ? 'text-center max-w-2xl mx-auto' : ''} ${className}`}>
    {eyebrow && (
      <div className={align === 'center' ? 'flex justify-center mb-2' : 'mb-2'}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
          {eyebrowIcon}
          <span>{eyebrow}</span>
        </span>
      </div>
    )}
    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
      {title}
    </h2>
    {description && (
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
        {description}
      </p>
    )}
  </div>
);