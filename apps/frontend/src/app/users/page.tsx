'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UserPlus, RefreshCw, Download } from 'lucide-react';
import { userService } from '../../services/userService';
import { backupService } from '../../services/backupService';
import { User, UserRole } from '../../types/user';
import { useAlert } from '../../context/AlertContext';

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
 