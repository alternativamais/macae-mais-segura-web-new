import api from '@/lib/api-client';
import {
  FrontendScreen,
  RoleFrontendScreenAssignment,
} from '@/types/frontend-screen';

const normalizeScreenIds = (screenIds: number[]) =>
  Array.from(
    new Set(screenIds.filter((screenId) => Number.isInteger(screenId))),
  );

export const frontendScreenService = {
  findAll: async (platform: string = 'web'): Promise<FrontendScreen[]> => {
    const { data } = await api.get<FrontendScreen[]>('/frontend/screens', {
      params: { platform },
    });
    return data;
  },

  findForRole: async (
    roleId: number,
    platform: string = 'web',
  ): Promise<RoleFrontendScreenAssignment[]> => {
    const { data } = await api.get<RoleFrontendScreenAssignment[]>(
      `/roles/${roleId}/frontend-screens`,
      {
      params: { platform },
      },
    );
    return data;
  },

  updateForRole: async (
    roleId: number,
    screenIds: number[],
    platform: string = 'web',
  ): Promise<RoleFrontendScreenAssignment[]> => {
    const { data } = await api.put<RoleFrontendScreenAssignment[]>(
      `/roles/${roleId}/frontend-screens`,
      { screenIds: normalizeScreenIds(screenIds) },
      {
        params: { platform },
      },
    );
    return data;
  },
};
