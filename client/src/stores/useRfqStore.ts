import * as React from 'react';

import {
  listRfq,
  createOrFetchRfq,
  updateRfq,
  updateRfqItem,
  deleteRfq,
  sendRfqToPurchaseOrder,
  getRfq,
  type CreateRfqPayload,
  type UpdateRfqPayload,
  type UpdateRfqItemPayload,
  type SendRfqToPoPayload,
  type RfqRecordDTO,
} from '../lib/api';

type Listener = () => void;

type RfqStoreState = {
  rfqs: RfqRecordDTO[];
  loading: boolean;
  error?: string;
};

const listeners = new Set<Listener>();
let state: RfqStoreState = {
  rfqs: [],
  loading: false,
  error: undefined,
};

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('useRfqStore listener failed', error);
    }
  });
}

function setState(patch: Partial<RfqStoreState>) {
  state = { ...state, ...patch };
  notify();
}

function upsert(list: RfqRecordDTO[], record: RfqRecordDTO) {
  const index = list.findIndex((entry) => entry.id === record.id);
  if (index >= 0) {
    const next = list.slice();
    next[index] = record;
    return next;
  }
  return [record, ...list];
}

function removeById(list: RfqRecordDTO[], id: string) {
  return list.filter((entry) => entry.id !== id);
}

export function getRfqStoreSnapshot() {
  return state;
}

export function subscribeRfqStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRfqStore() {
  return React.useSyncExternalStore(subscribeRfqStore, getRfqStoreSnapshot, getRfqStoreSnapshot);
}

export async function refreshRfqs() {
  setState({ loading: true, error: undefined });
  try {
    const rfqs = await listRfq();
    setState({ rfqs, loading: false, error: undefined });
    return rfqs;
  } catch (error: any) {
    const message = error?.message ?? 'Failed to load RFQs';
    setState({ rfqs: [], loading: false, error: message });
    throw error;
  }
}

export async function openRfq(payload: CreateRfqPayload) {
  try {
    const record = await createOrFetchRfq(payload);
    setState({ rfqs: upsert(state.rfqs, record), error: undefined });
    return record;
  } catch (error: any) {
    const message = error?.message ?? 'Failed to create RFQ';
    setState({ error: message });
    throw error;
  }
}

export async function saveRfq(id: string | number, payload: UpdateRfqPayload) {
  try {
    const record = await updateRfq(id, payload);
    setState({ rfqs: upsert(state.rfqs, record), error: undefined });
    return record;
  } catch (error: any) {
    const message = error?.message ?? 'Failed to update RFQ';
    setState({ error: message });
    throw error;
  }
}

export async function saveRfqItem(rfqId: string | number, itemId: string | number, payload: UpdateRfqItemPayload) {
  try {
    const record = await updateRfqItem(rfqId, itemId, payload);
    setState({ rfqs: upsert(state.rfqs, record), error: undefined });
    return record;
  } catch (error: any) {
    const message = error?.message ?? 'Failed to update RFQ item';
    setState({ error: message });
    throw error;
  }
}

export async function removeRfq(id: string | number) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('removeRfq: missing id');
  try {
    await deleteRfq(sid);
    setState({ rfqs: removeById(state.rfqs, sid), error: undefined });
  } catch (error: any) {
    const message = error?.message ?? 'Failed to delete RFQ';
    setState({ error: message });
    throw error;
  }
}

export async function sendRfqToPo(id: string | number, payload: SendRfqToPoPayload = {}) {
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('sendRfqToPo: missing id');
  try {
    const result = await sendRfqToPurchaseOrder(sid, payload);
    try {
      const fresh = await getRfq(sid);
      setState({ rfqs: upsert(state.rfqs, fresh), error: undefined });
    } catch {
      const match = state.rfqs.find((entry) => entry.id === sid);
      if (match) {
        const updated: RfqRecordDTO = { ...match, status: 'SentToPO' };
        setState({ rfqs: upsert(state.rfqs, updated), error: undefined });
      }
    }
    return result;
  } catch (error: any) {
    const message = error?.message ?? 'Failed to send RFQ to PO';
    setState({ error: message });
    throw error;
  }
}

export function getRfqById(id: string | number) {
  const sid = String(id ?? '').trim();
  return state.rfqs.find((entry) => entry.id === sid) ?? null;
}
