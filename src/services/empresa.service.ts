import api from '@/lib/api-client';
import { 
  Empresa 
} from '@/types/empresa';

export const empresaService = {
  findAllNoPagination: async (): Promise<Empresa[]> => {
    // Note: Assuming the API provides a way to list companies without pagination for selectors
    // If it only has paginated list, we would use that. 
    // Based on the user's setup for roles, it's likely similar.
    const { data } = await api.get<Empresa[]>('/empresas');
    return data;
  },

  findAll: async (page = 1, pageSize = 10) => {
    const { data } = await api.get('/empresas', {
      params: { page, pageSize },
    });
    return data;
  },

  findOne: async (id: number): Promise<Empresa> => {
    const { data } = await api.get<Empresa>(`/empresas/${id}`);
    return data;
  },

  create: async (payload: Partial<Empresa>): Promise<Empresa> => {
    const { data } = await api.post<Empresa>('/empresas', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Empresa>): Promise<Empresa> => {
    const { data } = await api.put<Empresa>(`/empresas/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/empresas/${id}`);
  },
};
