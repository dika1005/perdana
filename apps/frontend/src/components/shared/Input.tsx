'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', ...rest }, ref) => (
  <input
    ref={ref}
    className={`w-full px-3.5 py-2.5 rounded-xl skeuo-inset bg-transparent text-sm text-text-main outline-none transition-colors focus:border-brand-500 ${className}`}
    {...rest}
  />
));
Input.displayName = 'Input';
