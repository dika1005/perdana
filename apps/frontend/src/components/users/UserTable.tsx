'use client';

import React from 'react';
import { Search, UserCheck, UserX, KeyRound } from 'lucide-react';
import { User } from '../../types/user';

interface UserTableProps {
  users: User[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  onOpenResetPassword: (user: User) => void;
  onToggleActive: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  searchTerm,
  onSearchChange,
  onSearchKeyDown,
  onOpenResetPassword,
  onToggleActive,
}) => {
  return (
    <div className="skeuo p-6">
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Cari nama atau username kasir..." 
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="bg-transparent border-none outline-none w-full text-sm text-text-main placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Lengkap</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role / Akses</th>
              <th className="py-3 px-4">Status Akun</th>
              <th className="py-3 px-4">Dibuat Pada</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                  Memuat data pengguna...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                  Belum ada akun kasir di database.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-text-main text-xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60 shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{u.username}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${
                      u.role === 'SUPER_ADMIN' 
                        ? 'text-purple-700 bg-purple-50 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60' 
                        : 'text-blue-700 bg-blue-50 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60'
                    }`}>
                      {u.role === 'SUPER_ADMIN' ? '👑 Owner / Super Admin' : '🧑‍💼 Kasir'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_active ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 inline-flex items-center gap-1">
                        <UserX className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onOpenResetPassword(u)}
                        className="px-2.5 py-1.5 text-xs font-semibold skeuo-button text-blue-600 dark:text-blue-400 flex items-center gap-1 rounded-lg"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => onToggleActive(u)}
                          className={`px-2.5 py-1.5 text-xs font-semibold skeuo-button rounded-lg transition-colors ${
                            u.is_active 
                              ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40' 
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
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
