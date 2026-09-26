import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { apiClient } from '@/lib/api-client';
import { DEMO_MODE } from '@/lib/demo-mode';
import { queryClient } from '@/lib/query-client';
import { Sentry, initSentry } from '@/lib/sentry';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import './styles/globals.css';

initSentry();

const Tree = (
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NuqsAdapter>
            <RouterProvider router={router} />
            <Toaster richColors position="top-right" />
          </NuqsAdapter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);

async function iniciar() {
  // Precisa rodar antes do render: o AuthProvider chama /auth/me assim que monta.
  if (DEMO_MODE) {
    const { instalarDemo } = await import('./demo');
    instalarDemo(apiClient);
  }
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <Sentry.ErrorBoundary fallback={<FallbackErro />}>{Tree}</Sentry.ErrorBoundary>,
  );
}

iniciar();

function FallbackErro() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8 text-center">
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-semibold">Algo deu errado.</h1>
        <p className="text-muted-foreground">O erro foi reportado. Tente recarregar a página.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}
