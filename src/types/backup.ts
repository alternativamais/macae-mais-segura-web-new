import { PaginatedResponse } from './api';

export interface BackupMetadata {
  generatedAt?: string;
  tableCount?: number;
  rowCount?: number;
  sequenceCount?: number;
  notes?: string;
  format?: string;
}

export interface BackupRecord {
  id: number;
  fileName?: string | null;
  fileExtension?: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'running';
  updatedAt?: string;
  initiatedBy?: 'manual' | 'scheduled';
  failureReason?: string | null;
  fileSizeBytes?: string | number | null;
  checksumSha256?: string | null;
  storageProvider?: 'local' | 'external';
  uploadedToDropbox?: boolean;
  metadata?: BackupMetadata | null;
}

export interface BackupSummary {
  generatedAt: string;
  tableCount: number;
  rowCount: number;
  sequenceCount: number;
}

export interface BackupCreateResponse {
  id: number;
  fileName: string;
  createdAt: string;
  status: string;
  metadata: any;
  summary: BackupSummary;
}

export interface BackupSettings {
  id: number;
  enabled: boolean;
  frequencyMinutes: number;
  scheduledTime?: string | null;
  lastRunAt?: string;
  hasPassword: boolean;
  notes?: string;
  updatedAt: string;
}

export interface UpdateBackupSettingsPayload {
  enabled: boolean;
  frequencyMinutes: number;
  password?: string | null;
  notes?: string;
  scheduledTime?: string | null;
}

export interface BackupRestoreResponse {
  applied: boolean;
  mode: 'replace' | 'dry-run';
  summary: BackupSummary;
}

export interface BackupListResponse extends PaginatedResponse<BackupRecord> {}
