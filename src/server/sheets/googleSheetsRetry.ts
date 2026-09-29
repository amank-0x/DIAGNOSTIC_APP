import {
  executeEntitySyncToSheets,
  getServerSyncLogs,
  SyncLogEntry,
} from './googleSheetsSync';
import { WorksheetTabName } from './googleSheetsMapper';

/**
 * Google Sheets Retry Engine (`googleSheetsRetry`)
 *
 * Re-processes `FAILED` and `PENDING` synchronization items from `Sync_Log`
 * with attempt count tracking, duplicate row prevention (via `upsertRecordsToWorksheet`),
 * and maximum retry thresholds.
 */

const MAX_RETRY_ATTEMPTS = Number(process.env.GOOGLE_SHEETS_MAX_RETRY_ATTEMPTS || 5);

export interface RetryBatchResult {
  retriedCount: number;
  succeededCount: number;
  stillFailedCount: number;
  updatedLogs: SyncLogEntry[];
}

/**
 * Retry a list of failed/pending Sync_Log items or all failed items in the server store.
 */
export async function retryFailedGoogleSheetsSyncs(
  itemsToRetry?: {
    sync_id: string;
    entity_type: WorksheetTabName;
    entity_id: string;
    operation: SyncLogEntry['operation'];
    attempt_count: number;
    created_at: string;
    payload?: Record<string, any>;
  }[]
): Promise<RetryBatchResult> {
  const candidates =
    itemsToRetry && itemsToRetry.length > 0
      ? itemsToRetry
      : getServerSyncLogs().filter(
          (l) => (l.status === 'FAILED' || l.status === 'PENDING') && l.attempt_count < MAX_RETRY_ATTEMPTS
        );

  let retriedCount = 0;
  let succeededCount = 0;
  let stillFailedCount = 0;
  const updatedLogs: SyncLogEntry[] = [];

  for (const item of candidates) {
    retriedCount++;
    const records = item.payload ? [item.payload] : [{ id: item.entity_id }];
    const res = await executeEntitySyncToSheets({
      syncId: item.sync_id,
      entityType: item.entity_type,
      entityId: item.entity_id,
      operation: item.operation,
      records,
      previousAttemptCount: item.attempt_count || 1,
      createdAt: item.created_at,
    });

    updatedLogs.push(res.syncLog);
    if (res.syncLog.status === 'SUCCESS') {
      succeededCount++;
    } else {
      stillFailedCount++;
    }
  }

  return {
    retriedCount,
    succeededCount,
    stillFailedCount,
    updatedLogs,
  };
}
