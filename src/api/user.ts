import { apiClient } from './client';

export const MANAGER_ROLE = 'WEEKEND_MANAGER';

export const getMyRoles = async () =>
    (await apiClient.get<{ roles: string[] }>('/user/me')).data.roles ?? [];
