import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/contexts/auth-context';
import { LoginPage } from '@/features/auth/login';
import { CompradorFormPage } from '@/features/compradores/form';
import { CompradoresListPage } from '@/features/compradores/list';
import { DashboardPage } from '@/features/dashboard/dashboard';
import { ParceiroFormPage } from '@/features/parceiros/form';
import { ParceirosListPage } from '@/features/parceiros/list';
import { PrecatoriosListPage } from '@/features/precatorios/list';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';

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
