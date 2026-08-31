'use client';

import React from 'react';
import { PAYMENT_METHODS } from '../../data/paymentMethods';
import type { PaymentMethod } from '../../types/transaction';

export interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  columns?: 3 | 4;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  columns = 3,
}) => (
  <div className={`grid ${columns === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
    {PAYMENT_METHODS.map(pm => {
      const isActive = value === pm.id;
      const Icon = pm.icon;
      return (
        <button
          key={pm.id}
          type="button"
          onClick={() => onChange(pm.id)}
          className={`py-2.5 px-2 text-center rounded-xl transition-all border-2 cursor-pointer ${
            isActive
              ? `${pm.activeClass} font-bold shadow-xs`
              : 'border-slate-200 dark:border-slate-800 skeuo-button text-slate-600 dark:text-slate-400 hover:text-text-main'
          }`}
        >
          <Icon className="w-4 h-4 mx-auto mb-1" />
          <p className="text-xs font-bold">{pm.label}</p>
        </button>
      );
    })}
  </div>
);
