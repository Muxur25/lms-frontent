import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { Toaster } from 'react-hot-toast';
import type { ReactNode } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Better UX for enterprise apps
      retry: 1, // Don't retry infinitely
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    },
  },
});

export function AppProviders({ children }: { children?: ReactNode }) {
  // If no children passed, we render the router. 
  // If children passed (for testing), render children.
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{
        className: 'dark:bg-slate-800 dark:text-white',
        style: {
          background: 'var(--bg-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-3)'
        },
      }} />
      {children || <RouterProvider router={router} />}
    </QueryClientProvider>
  );
}
