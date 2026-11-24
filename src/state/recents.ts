import { createStore, useStore } from '@/lib/store';

export type CallEntry = {
  id: string;
  number: string;
  name: string | null;
  timestamp: number;
};

/**
 * Calls placed from this app. Neither iOS nor Android lets a regular app read the
 * system call log, so the app keeps its own history (in memory for now).
 */
const store = createStore<CallEntry[]>([]);

export function addRecent(entry: Omit<CallEntry, 'id' | 'timestamp'>) {
  const timestamp = Date.now();
  store.set((list) => [{ ...entry, id: `${timestamp}-${list.length}`, timestamp }, ...list].slice(0, 500));
}

export function removeRecent(id: string) {
  store.set((list) => list.filter((e) => e.id !== id));
}

export function clearRecents() {
  store.set([]);
}

export function useRecents() {
  return useStore(store);
}
