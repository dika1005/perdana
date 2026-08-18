'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  UserCog, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Search, 
  RefreshCw, 
  X, 
  Lock 
} from 'lucide-react';
import { userService } from '../../services/userService';
import { User, UserRole } from '../../types/user';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; user?: User | null }>({ open: false });

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');

  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUsers({ search: searchTerm || undefined });
      setUsers(res.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || password.length < 8) {
      alert('Nama, username wajib diisi dan password minimal 8 karakter');
      return;
    }
    setSubmitting(true);
    try {
      await userService.createUser({
        name: name.trim(),
        username: username.trim(),
        password,
        role,
      });
      setCreateModal(false);
      setName('');
      setUsername('');
      setPassword('');
      await fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal membuat pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal.user || newPassword.length < 8) {
      alert('Password baru minimal 8 karakter');
      return;
    }
    setSubmitting(true);
    try {
      await userService.resetPassword(resetModal.user.id, newPassword);
      alert(`Password untuk ${resetModal.user.name} berhasil diperbarui.`);
      setResetModal({ open: false });
      setNewPassword('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mereset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const actionText = user.is_active ? 'menonaktifkan' : 'mengaktifkan kembali';
    if (!confirm(`Apakah Anda yakin ingin ${actionText} akun kasir "${user.name}"?`)) return;
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id);
      } else {
        await userService.updateUser(user.id, { is_active: true });
      }
      await fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || `Gagal mengubah status akun`);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Manajemen Kasir & Pengguna</h1>
          <p className="text-text-muted text-sm">Kelola akun kasir, hak akses, dan reset password.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchUsers} 
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button 
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Kasir Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="skeuo p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 skeuo-inset">
            <Search className="w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari nama atau username kasir..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
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
                          onClick={() => setResetModal({ open: true, user: u })}
                          className="px-3 py-1.5 text-xs font-bold skeuo-button text-brand-600 flex items-center gap-1"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Reset Password
                        </button>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-3 py-1.5 text-xs font-bold skeuo-button ${
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

      {/* Modal Tambah User */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateUser} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">Tambah Akun Kasir Baru</h2>
              <button type="button" onClick={() => setCreateModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Ahmad Kasir"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Contoh: ahmad12"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Password Awal (Min. 8 Karakter) *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Role / Hak Akses</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
                >
                  <option value="ADMIN">ADMIN (Kasir & Operator)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCreateModal(false)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModal.open && resetModal.user && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleResetPassword} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">Reset Password Kasir</h2>
              <button type="button" onClick={() => setResetModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-muted mb-4">
              Masukkan password baru untuk akun <strong>{resetModal.user.name}</strong> ({resetModal.user.username}).
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Password Baru (Min. 8 Karakter) *</label>
                <div className="flex items-center gap-2 px-4 py-2.5 skeuo-inset rounded-xl">
                  <Lock className="w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full bg-transparent outline-none text-text-main"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setResetModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submitting ? 'Memproses...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
