'use client';

import React from 'react';

export interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, required, hint, children, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-text-muted mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
  </div>
);
