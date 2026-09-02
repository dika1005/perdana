import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',

  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Wajib: agar cookie JWT terkirim otomatis
});

/** Halaman yang tidak butuh sesi: jangan pernah redirect/refresh dari sini. */
const PUBLIC_PATHS = ['/', '/login', '/cek-pesanan', '/tracking'];

const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) || path.startsWith('/tracking');

// Response interceptor: perpanjang sesi otomatis via /auth/refresh sebelum
// menyerah dan mengarahkan ke /login.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : '/';

    // Bukan 401 / bukan request retryable / halaman publik -> teruskan error.
    if (
      !config ||
      status !== 401 ||
      config._retry ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/login') ||
      isPublicPath(pathname)
    ) {
      // Fallback lama: sesi benar-benar habis di halaman privat -> login.
      if (status === 401 && typeof window !== 'undefined' && !isPublicPath(pathname) && pathname !== '/login' && !config?._retry) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      // Refresh memakai cookie refresh_token (httpOnly); cookies baru
      // di-set ulang otomatis oleh server (rotasi).
      await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      // Sesi baru aktif -> ulangi request asli.
      return apiClient.request(config);
    } catch {
      // Refresh gagal -> sesi benar-benar habis.
      if (typeof window !== 'undefined' && pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  }
);