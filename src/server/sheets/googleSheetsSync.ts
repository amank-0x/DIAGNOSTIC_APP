import { getGoogleSheetsAuthStatus } from './googleSheetsAuth';
import { WorksheetTabName } from './googleSheetsMapper';
import { upsertRecordsToWorksheet } from './googleSheetsService';

/**
 * Google Sheets Synchronization Orchestrator (`googleSheetsSync`)
 *
 * CRITICAL ARCHITECTURE INVARIANT:
 * 1. Primary Database (PostgreSQL / Firestore) is ALWAYS written first.
 * 2. Google Sheets synchronization happens AFTER the primary database write succeeds.
 * 3. If Google Sheets API fails (or credentials are not configured yet),
 *    the primary database record is NEVER deleted or rolled back, and the operation is
 *    honestly recorded as `FAILED` in `Sync_Log` so Admin can retry it.
 */

export interface SyncLogEntry {
  sync_id: string;
  entity_type: WorksheetTabName;
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'MANUAL_SYNC' | 'INBOUND_IMPORT';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  attempt_count: number;
  last_attempt_at: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  payload?: Record<string, any>;
}

const serverSyncLogStore = new Map<string, SyncLogEntry>();

export function getServerSyncLogs(): SyncLogEntry[] {
  return Array.from(serverSyncLogStore.values()).sort(
    (a, b) => new Date(b.last_attempt_at).getTime() - new Date(a.last_attempt_at).getTime()
  );
}

export function getServerSyncMetrics() {
  const logs = getServerSyncLogs();
  let successCount = 0;
  let failedCount = 0;
  let pendingCount = 0;
  let lastSuccessAt: string | null = null;
  let lastError: string | null = null;

  for (const log of logs) {
    if (log.status === 'SUCCESS') {
      successCount++;
      if (!lastSuccessAt || log.last_attempt_at > lastSuccessAt) {
        lastSuccessAt = log.last_attempt_at;
      }
    } else if (log.status === 'FAILED') {
      failedCount++;
      if (!lastError && log.error_message) {
        lastError = log.error_message;
      }
    } else if (log.status === 'PENDING') {
      pendingCount++;
    }
  }

  return {
    successCount,
    failedCount,
    pendingCount,
    lastSuccessAt,
    lastError,
  };
}

export async function executeEntitySyncToSheets(params: {
  syncId?: string;
  entityType: WorksheetTabName;
  entityId: string;
  operation: SyncLogEntry['operation'];
  records: Record<string, any>[];
  previousAttemptCount?: number;
  createdAt?: string;
  bearerToken?: string;
}): Promise<{
  syncLog: SyncLogEntry;
  liveApiCalled: boolean;
  syncedCount: number;
}> {
  const now = new Date().toISOString();
  const syncId =
    params.syncId ||
    `SYNC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const attemptCount = (params.previousAttemptCount || 0) + 1;
  const createdAt = params.createdAt || now;

  const authStatus = getGoogleSheetsAuthStatus();
  const canCallLiveApi = authStatus.configured || authStatus.oauthConnected || Boolean(params.bearerToken);

  if (canCallLiveApi) {
    try {
      const result = await upsertRecordsToWorksheet(
        params.entityType,
        params.records,
        params.bearerToken
      );
      const entry: SyncLogEntry = {
        sync_id: syncId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        operation: params.operation,
        status: 'SUCCESS',
        attempt_count: attemptCount,
        last_attempt_at: now,
        error_message: null,
        created_at: createdAt,
        updated_at: now,
      };
      serverSyncLogStore.set(syncId, entry);

      // Write the Sync Log record itself to the `Sync Logs` worksheet tab non-blockingly
      if (params.entityType !== 'Sync Logs' && params.entityType !== 'Sync_Log') {
        upsertRecordsToWorksheet('Sync Logs', [entry], params.bearerToken).catch(() => {});
      }

      return {
        syncLog: entry,
        liveApiCalled: true,
        syncedCount: result.syncedCount,
      };
    } catch (err: any) {
      const errMsg = err?.message || 'Google Sheets API synchronization failed';
      const failedEntry: SyncLogEntry = {
        sync_id: syncId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        operation: params.operation,
        status: 'FAILED',
        attempt_count: attemptCount,
        last_attempt_at: now,
        error_message: errMsg,
        created_at: createdAt,
        updated_at: now,
        payload: params.records[0],
      };
      serverSyncLogStore.set(syncId, failedEntry);

      return {
        syncLog: failedEntry,
        liveApiCalled: true,
        syncedCount: 0,
      };
    }
  }

  // Honest failure reporting when credentials are not yet configured:
  // Primary DB save succeeded, Google Sheets sync is marked FAILED in Sync_Log for retry once connected.
  const missingCredsEntry: SyncLogEntry = {
    sync_id: syncId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    operation: params.operation,
    status: 'FAILED',
    attempt_count: attemptCount,
    last_attempt_at: now,
    error_message:
      'Google Sheets API credentials not configured. Connect Google Sheets via OAuth in /admin/google-sheets or set GOOGLE_SHEETS_SPREADSHEET_ID & Service Account in .env.',
    created_at: createdAt,
    updated_at: now,
    payload: params.records[0],
  };
  serverSyncLogStore.set(syncId, missingCredsEntry);

  return {
    syncLog: missingCredsEntry,
    liveApiCalled: false,
    syncedCount: 0,
  };
}
