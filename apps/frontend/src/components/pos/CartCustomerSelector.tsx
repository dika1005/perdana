'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CartCustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  customCustomerName: string;
  onCustomCustomerNameChange: (val: string) => void;
}

export const CartCustomerSelector: React.FC<CartCustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  customCustomerName,
  onCustomCustomerNameChange,
}) => {
  return (
    <div className="my-3 p-3 rounded-xl skeuo-inset shrink-0">
      <label className="text-xs font-bold text-text-muted mb-1.5 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-brand-500" />
        <span>Informasi Pelanggan:</span>
      </label>
      <select 
        value={selectedCustomer ? selectedCustomer.id : ''} 
        onChange={e => {
          const id = Number(e.target.value);
          const found = customers.find(c => c.id === id);
          onSelectCustomer(found || null);
        }}
        className="w-full px-3 py-2 text-xs font-medium text-text-main outline-none skeuo-inset cursor-pointer focus:border-brand-500 transition-all [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
      >
        <option value="">Pelanggan Umum (Walk-in)</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>{c.name} {c.phone ? `• ${c.phone}` : ''}</option>
        ))}
      </select>
      {!selectedCustomer && (
        <input 
          type="text" 
          placeholder="Ketik nama pelanggan / instansi..." 
          value={customCustomerName}
          onChange={e => onCustomCustomerNameChange(e.target.value)}
          className="w-full mt-2 px-3 py-2 text-xs text-text-main outline-none skeuo-inset focus:border-brand-500 transition-all"
        />
      )}
    </div>
  );
};
