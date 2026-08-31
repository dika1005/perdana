'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UserPlus, RefreshCw, Download } from 'lucide-react';
import { userService } from '../../services/userService';
import { backupService } from '../../services/backupService';
import { User, UserRole } from '../../types/user';
import { useAlert } from '../../context/AlertContext';
import { PageHeader, Button, ErrorBanner } from '../../components/shared';

// Modular User Components
import { UserTable } from '../../components/users/UserTable';
import { UserFormModal } from '../../components/users/UserFormModal';
import { UserResetPasswordModal } from '../../components/users/UserResetPasswordModal';

export default function UsersManagementPage() {
  const { showAlert, showConfirm, showToast } = useAlert();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; user?: User | null }>({ open: false });

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'ADMIN' as UserRole,
  });

  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDownloadBackup = async () => {
    setBackingUp(true);
    try {
      showToast('Sedang membuat file cadangan database...', 'info');
      await backupService.downloadSqlBackup();
      showToast('Cadangan database (.sql) berhasil diunduh!', 'success');
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Mengunduh Backup',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat mengekspor database.',
        type: 'error',
      });
    } finally {
      setBackingUp(false);
    }
  };

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
    if (!createForm.name.trim() || !createForm.username.trim() || createForm.password.length < 8) {
      await showAlert({
        title: 'Form Belum Lengkap',
        message: 'Nama, username wajib diisi dan password minimal 8 karakter.',
        type: 'warning',
      });
      return;
    }
    setSubmitting(true);
    try {
      await userService.createUser({
        name: createForm.name.trim(),
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setCreateModal(false);
      setCreateForm({
        name: '',
        username: '',
        password: '',
        role: 'ADMIN',
      });
      showToast('Pengguna baru berhasil dibuat!', 'success');
      await fetchUsers();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Membuat Pengguna',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat membuat akun pengguna.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal.user || newPassword.length < 8) {
      await showAlert({
        title: 'Password Terlalu Pendek',
        message: 'Password baru minimal 8 karakter.',
        type: 'warning',
      });
      return;
    }
    setSubmitting(true);
    try {
      await userService.resetPassword(resetModal.user.id, newPassword);
      setResetModal({ open: false });
      setNewPassword('');
      showToast(`Password untuk ${resetModal.user.name} berhasil diperbarui!`, 'success');
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Mereset Password',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat memperbarui password.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const actionText = user.is_active ? 'menonaktifkan' : 'mengaktifkan kembali';
    const confirmed = await showConfirm({
      title: `${user.is_active ? 'Nonaktifkan' : 'Aktifkan'} Akun?`,
      message: `Apakah Anda yakin ingin ${actionText} akun kasir "${user.name}"?`,
      type: user.is_active ? 'danger' : 'info',
      confirmText: user.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
    });
    if (!confirmed) return;

    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id);
      } else {
        await userService.updateUser(user.id, { is_active: true });
      }
      showToast(`Akun "${user.name}" berhasil di${actionText}`, 'info');
      await fetchUsers();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Mengubah Status Akun',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat mengubah status akun.',
        type: 'error',
      });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Manajemen Kasir & Pengguna"
        subtitle="Kelola akun kasir, hak akses, dan reset password."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleDownloadBackup}
              disabled={backingUp}
              title="Download cadangan seluruh database (.sql)"
            >
              <Download className={`w-3.5 h-3.5 ${backingUp ? 'animate-pulse' : ''}`} />
              {backingUp ? 'Mengekspor...' : 'Backup Database'}
            </Button>
            <Button variant="secondary" onClick={fetchUsers}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              <UserPlus className="w-3.5 h-3.5" />
              Tambah Kasir Baru
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchUsers} />}

      {/* User Table */}
      <UserTable
        users={users}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchKeyDown={e => e.key === 'Enter' && fetchUsers()}
        onOpenResetPassword={u => setResetModal({ open: true, user: u })}
        onToggleActive={handleToggleActive}
      />

      {/* Modal Tambah User */}
      <UserFormModal
        isOpen={createModal}
        formData={createForm}
        onChange={(field, value) => setCreateForm(prev => ({ ...prev, [field]: value }))}
        submitting={submitting}
        onClose={() => setCreateModal(false)}
        onSubmit={handleCreateUser}
      />

      {/* Modal Reset Password */}
      <UserResetPasswordModal
        isOpen={resetModal.open}
        user={resetModal.user || null}
        newPassword={newPassword}
        onChangePassword={setNewPassword}
        submitting={submitting}
        onClose={() => setResetModal({ open: false })}
        onSubmit={handleResetPassword}
      />
    </DashboardLayout>
  );
}