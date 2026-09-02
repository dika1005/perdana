'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Provider global untuk TanStack React Query.
 * Memberikan caching, dedup request, dan revalidasi otomatis untuk semua
 * data fetching di aplikasi (dashboard, POS, laporan, dst.).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap segar 30 detik -> navigasi antar halaman
            // tidak memicu refetch berulang.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}