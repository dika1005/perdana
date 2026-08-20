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
        <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl">
          <Search className="w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari nama atau username kasir..." 
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="bg-transparent border-none outline-none w-full text-sm text-text-main"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-3">Nama Lengkap</th>
              <th className="pb-3">Username</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status Akun</th>
              <th className="pb-3">Dibuat Pada</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                  Memuat data pengguna...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                  Belum ada akun kasir di database.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                  <td className="py-3.5 font-bold text-text-main flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg skeuo flex items-center justify-center text-brand-500 font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    {u.name}
                  </td>
                  <td className="py-3.5 text-text-muted font-mono text-xs">{u.username}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold skeuo-inset ${
                      u.role === 'SUPER_ADMIN' 
                        ? 'text-purple-600 bg-purple-50/50' 
                        : 'text-brand-600 bg-brand-50/50'
                    }`}>
                      {u.role === 'SUPER_ADMIN' ? 'Super Admin (Owner)' : 'Kasir / Admin'}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {u.is_active ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-emerald-600 bg-emerald-50 skeuo-inset flex items-center gap-1 w-max">
                        <UserCheck className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-red-500 bg-red-50 skeuo-inset flex items-center gap-1 w-max">
                        <UserX className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-text-muted text-xs">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onOpenResetPassword(u)}
                        className="px-3 py-1.5 text-xs font-bold skeuo-button text-brand-600 flex items-center gap-1 rounded-lg"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => onToggleActive(u)}
                          className={`px-3 py-1.5 text-xs font-bold skeuo-button rounded-lg ${
                            u.is_active ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'
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
