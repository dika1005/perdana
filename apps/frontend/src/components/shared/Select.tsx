'use client';

import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', children, ...rest }, ref) => (
  <select
    ref={ref}
    className={`w-full px-3.5 py-2.5 rounded-xl skeuo-inset bg-transparent text-sm text-text-main outline-none transition-colors focus:border-brand-500 cursor-pointer ${className}`}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
