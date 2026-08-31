'use client';

import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...rest }, ref) => (
  <textarea
    ref={ref}
    className={`w-full p-3.5 rounded-xl skeuo-inset bg-transparent text-sm text-text-main outline-none resize-none transition-colors focus:border-brand-500 ${className}`}
    {...rest}
  />
));
Textarea.displayName = 'Textarea';
