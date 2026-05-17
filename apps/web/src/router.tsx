import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/features/auth/login';
import { DashboardPage } from '@/features/dashboard/dashboard';
import { PrecatoriosListPage } from '@/features/precatorios/list';

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
        ],
      },
    ],
  },
]);
