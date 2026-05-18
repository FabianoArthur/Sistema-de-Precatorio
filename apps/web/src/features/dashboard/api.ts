import { apiClient } from '@/lib/api-client';
import type { DashboardData } from '@preca/shared';

export const dashboardApi = {
  get: () => apiClient.get<DashboardData>('/dashboard').then((r) => r.data),
};
