

import * as React from 'react';
import {
  updateRequestItemStatus,
  sendRFQForItem,
  deleteRequestItem,
  updateRequestItem,
} from '../lib/api';
import type { RequestItemPayload } from '../lib/api';

export type ItemId = string | number;

export type UseRequestItemsActionsOptions = {
  /** Called after a successful action to refresh the parent list */
  onRefresh?: () => Promise<any> | void;
  /** Optional toast interface (fallbacks to alert/console) */
  toast?: {
    success?: (m: string) => void;
    error?: (m: string) => void;
    info?: (m: string) => void;
  };
};

export function useRequestItemsActions(opts: UseRequestItemsActionsOptions = {}) {
  const { onRefresh, toast } = opts;

  // Busy map keyed by `${reqId}:${itemId}`
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});

  const keyOf = (reqId?: ItemId, itemId?: ItemId) => `${String(reqId ?? '')}:${String(itemId ?? '')}`;

  const withBusy = React.useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
      setBusy((b) => ({ ...b, [key]: true }));
      try {
        const res = await fn();
        return res;
      } finally {
        setBusy((b) => {
          const { [key]: _omit, ...rest } = b;
          return rest;
        });
      }
    },
    []
  );

  const safeCall = async (cb: () => Promise<any>, okMsg: string) => {
    try {
      const r = await cb();
      toast?.success?.(okMsg) ?? console.log(okMsg);
      await onRefresh?.();
      return r;
    } catch (e: any) {
      const msg = e?.message || 'Action failed';
      toast?.error?.(msg) ?? alert(msg);
      throw e;
    }
  };

  // --- Actions ---
  const approve = React.useCallback(async (reqId: ItemId | undefined, itemId: ItemId) => {
    const k = keyOf(reqId, itemId);
    return withBusy(k, () => safeCall(
      () => updateRequestItemStatus(String(reqId ?? ''), String(itemId), 'Approved'),
      'Item approved'
    ));
  }, [withBusy]);

  const reject = React.useCallback(async (reqId: ItemId | undefined, itemId: ItemId) => {
    const k = keyOf(reqId, itemId);
    return withBusy(k, () => safeCall(
      () => updateRequestItemStatus(String(reqId ?? ''), String(itemId), 'Rejected'),
      'Item rejected'
    ));
  }, [withBusy]);

  const sendRFQ = React.useCallback(async (reqId: ItemId | undefined, itemId: ItemId) => {
    const k = keyOf(reqId, itemId);
    return withBusy(k, () => safeCall(
      () => sendRFQForItem(String(reqId ?? ''), String(itemId)),
      'RFQ sent'
    ));
  }, [withBusy]);

  const deleteItem = React.useCallback(async (reqId: ItemId | undefined, itemId: ItemId) => {
    const k = keyOf(reqId, itemId);
    return withBusy(k, () => safeCall(
      () => deleteRequestItem(String(reqId ?? ''), String(itemId)),
      'Item deleted'
    ));
  }, [withBusy]);

  const editItem = React.useCallback(async (reqId: ItemId | undefined, itemId: ItemId, payload: RequestItemPayload) => {
    const k = keyOf(reqId, itemId);
    return withBusy(k, () => safeCall(
      () => updateRequestItem(String(reqId ?? ''), String(itemId), payload),
      'Item updated'
    ));
  }, [withBusy]);

  const isBusy = React.useCallback((reqId?: ItemId, itemId?: ItemId) => !!busy[keyOf(reqId, itemId)], [busy]);

  return {
    approve,
    reject,
    sendRFQ,
    deleteItem,
    editItem,
    isBusy,
    busyKeys: busy,
  } as const;
}

export default useRequestItemsActions;