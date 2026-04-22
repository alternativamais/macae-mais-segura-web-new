import api from '@/lib/api-client';
import { 
  BackupRecord, 
  BackupSettings, 
  BackupCreateResponse,
  BackupRestoreResponse,
  UpdateBackupSettingsPayload,
  BackupListResponse
} from '@/types/backup';

export const backupService = {
  listBackups: async (page = 1, limit = 20): Promise<BackupListResponse> => {
    const { data } = await api.get<{
      items: BackupRecord[]
      pagination: {
        page: number
        limit: number
        total: number
      }
    }>('/backups', {
      params: { page, limit },
    });
    return {
      items: data.items,
      total: data.pagination.total,
      page: data.pagination.page,
      pageSize: data.pagination.limit,
    };
  },

  createBackup: async (password: string, notes?: string): Promise<BackupCreateResponse> => {
    const { data } = await api.post<BackupCreateResponse>('/backups', {
      password,
      notes,
    });
    return data;
  },

  downloadBackup: async (id: number): Promise<Blob> => {
    const { data } = await api.get(`/backups/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  getSettings: async (): Promise<BackupSettings> => {
    const { data } = await api.get<BackupSettings>('/backups/settings');
    return data;
  },

  updateSettings: async (payload: UpdateBackupSettingsPayload): Promise<BackupSettings> => {
    const { data } = await api.put<BackupSettings>('/backups/settings', payload);
    return data;
  },

  restoreFromRecord: async (
    id: number,
    password: string,
    mode: 'replace' | 'dry-run' = 'replace'
  ): Promise<BackupRestoreResponse> => {
    const { data } = await api.post<BackupRestoreResponse>(`/backups/${id}/restore`, {
      password,
      mode,
    });
    return data;
  },

  restoreFromUpload: async (
    file: File,
    password: string,
    mode: 'replace' | 'dry-run' = 'replace'
  ): Promise<BackupRestoreResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    formData.append('mode', mode);

    const { data } = await api.post<BackupRestoreResponse>('/backups/restore/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteBackup: async (id: number): Promise<{ status: string; id: number }> => {
    const { data } = await api.delete<{ status: string; id: number }>(`/backups/${id}`);
    return data;
  },
};
