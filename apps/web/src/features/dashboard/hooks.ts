import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    staleTime: 30_000,
  });
}
