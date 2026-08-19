import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800/api/v1',

  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Wajib: agar cookie JWT terkirim otomatis
});

// Response interceptor untuk menangani session expired / error validasi
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/') {
      // Optional: Panggil endpoint refresh token otomatis atau redirect ke login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
