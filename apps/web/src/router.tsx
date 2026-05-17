import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/features/auth/login';
import { DashboardPage } from '@/features/dashboard/dashboard';
import { PrecatoriosListPage } from '@/features/precatorios/list';
import { CedentesListPage } from '@/features/cedentes/list';
import { CedenteFormPage } from '@/features/cedentes/form';
import { ParceirosListPage } from '@/features/parceiros/list';
import { ParceiroFormPage } from '@/features/parceiros/form';
import { CompradoresListPage } from '@/features/compradores/list';
import { CompradorFormPage } from '@/features/compradores/form';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/precatorios', element: <PrecatoriosListPage /> },
          { path: '/cedentes', element: <CedentesListPage /> },
          { path: '/cedentes/novo', element: <CedenteFormPage /> },
          { path: '/cedentes/:id', element: <CedenteFormPage /> },
          { path: '/parceiros', element: <ParceirosListPage /> },
          { path: '/parceiros/novo', element: <ParceiroFormPage /> },
          { path: '/parceiros/:id', element: <ParceiroFormPage /> },
          { path: '/compradores', element: <CompradoresListPage /> },
          { path: '/compradores/novo', element: <CompradorFormPage /> },
          { path: '/compradores/:id', element: <CompradorFormPage /> },
        ],
      },
    ],
  },
]);
