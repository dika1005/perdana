'use client';

import React from 'react';
import { Search, Phone, MapPin, Trash2, Edit2, Download } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSelectCustomer: (cust: Customer) => void;
  onEditCustomer: (e: React.MouseEvent, cust: Customer) => void;
  onDeleteCustomer: (e: React.MouseEvent, id: number) => void;
  onExportCsv: () => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onSelectCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onExportCsv,
}) => {
  return (
    <div className="skeuo p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <form onSubmit={onSearchSubmit} className="flex gap-2.5 w-full sm:max-w-md">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari nama atau no. HP pelanggan..." 
              className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
          <button type="submit" className="px-4 py-2 font-semibold skeuo-button text-text-main text-xs rounded-xl">
            Cari
          </button>
        </form>

        <button
          onClick={onExportCsv}
          disabled={customers.length === 0}
          className="px-3.5 py-2 rounded-xl skeuo-button text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          title="Ekspor daftar pelanggan ke CSV"
        >
          <Download className="w-3.5 h-3.5 text-blue-500" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Pelanggan</th>
              <th className="py-3 px-4">Nomor WhatsApp / HP</th>
              <th className="py-3 px-4">Alamat</th>
              <th className="py-3 px-4">Terdaftar Pada</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                  Memuat data pelanggan...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                  Belum ada data pelanggan di database.
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => onSelectCustomer(customer)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-semibold text-text-main text-xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60 shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-text-main">{customer.name}</span>
                      <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        Klik untuk riwayat pesanan &rarr;
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                    {customer.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" /> {customer.phone}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                    {customer.address ? (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" /> {customer.address}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => onEditCustomer(e, customer)}
                        className="p-1.5 skeuo-button text-blue-600 hover:text-blue-700 rounded-lg"
                        title="Edit Data Pelanggan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => onDeleteCustomer(e, customer.id)}
                        className="p-1.5 skeuo-button text-rose-500 hover:text-rose-600 rounded-lg"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
