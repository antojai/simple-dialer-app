import {
  addContactsChangeListener,
  Contact,
  ContactField,
  ContactsSortOrder,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-contacts';
import { Platform } from 'react-native';

import { digitsOf, isSamePhone, toT9 } from '@/lib/phone';
import { createStore, useStore } from '@/lib/store';

export type ContactPhone = { id: string; label: string | null; number: string };

export type DialerContact = {
  id: string;
  name: string;
  phones: ContactPhone[];
  favourite: boolean;
  thumbnail: string | null;
  /** Keypad digits for each word of the name, used for T9 search. */
  t9Words: string[];
};

export type ContactsStatus =
  | 'idle' // permission not asked yet
  | 'loading'
  | 'ready'
  | 'denied'
  | 'unavailable' // platform without a contacts API (web)
  | 'error';

type ContactsState = {
  status: ContactsStatus;
  contacts: DialerContact[];
  canAskAgain: boolean;
};

const store = createStore<ContactsState>({
  status: Platform.OS === 'web' ? 'unavailable' : 'idle',
  contacts: [],
  canAskAgain: true,
});

const FIELDS = [
  ContactField.FULL_NAME,
  ContactField.PHONES,
  ContactField.IS_FAVOURITE,
  ContactField.THUMBNAIL,
] as const;

let inFlight: Promise<void> | null = null;
let listening = false;

/**
 * Loads device contacts into the shared store.
 * With `request: true` the permission prompt is shown if it hasn't been answered yet.
 */
export function loadContacts({ request }: { request: boolean }): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  inFlight ??= fetchContacts(request).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function fetchContacts(request: boolean) {
  try {
    let permission = await getPermissionsAsync();
    if (!permission.granted && request && permission.canAskAgain) {
      permission = await requestPermissionsAsync();
    }
    if (!permission.granted) {
      store.set((s) => ({
        ...s,
        status: permission.status === 'undetermined' ? 'idle' : 'denied',
        canAskAgain: permission.canAskAgain,
      }));
      return;
    }

    if (store.get().status !== 'ready') store.set((s) => ({ ...s, status: 'loading' }));

    const details = await Contact.getAllDetails(FIELDS, {
      sortOrder: ContactsSortOrder.UserDefault,
    });

    const contacts: DialerContact[] = details
      .map((d) => {
        const name = d.fullName?.trim() || d.phones[0]?.number || '';
        return {
          id: d.id,
          name,
          phones: d.phones
            .filter((p) => !!p.number)
            .map((p) => ({ id: p.id, label: p.label ?? null, number: p.number! })),
          favourite: !!d.isFavourite,
          thumbnail: d.thumbnail,
          t9Words: name.split(/\s+/).map(toT9).filter(Boolean),
        };
      })
      .filter((c) => c.name && c.phones.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    store.set({ status: 'ready', contacts, canAskAgain: true });

    if (!listening) {
      listening = true;
      addContactsChangeListener(() => {
        loadContacts({ request: false });
      });
    }
  } catch (error) {
    console.warn('Failed to load contacts', error);
    store.set((s) => ({ ...s, status: 'error' }));
  }
}

export function useContacts() {
  return useStore(store);
}

/** Finds the contact that owns a phone number. */
export function findContactByNumber(
  contacts: DialerContact[],
  number: string
): DialerContact | undefined {
  if (digitsOf(number).length < 3) return undefined;
  return contacts.find((c) => c.phones.some((p) => isSamePhone(p.number, number)));
}

export function lookupName(number: string): string | null {
  return findContactByNumber(store.get().contacts, number)?.name ?? null;
}

export type DialMatch = { contact: DialerContact; phone: ContactPhone };

/**
 * Keypad search: matches contacts whose name (as keypad digits) starts with
 * the typed digits, or whose number contains them.
 */
export function matchDialInput(contacts: DialerContact[], input: string, limit = 30): DialMatch[] {
  const digits = digitsOf(input);
  if (!digits) return [];

  const nameMatches: DialMatch[] = [];
  const numberMatches: DialMatch[] = [];

  for (const contact of contacts) {
    const byName =
      contact.t9Words.some((w) => w.startsWith(digits)) ||
      contact.t9Words.join('').startsWith(digits);

    for (const phone of contact.phones) {
      if (byName) nameMatches.push({ contact, phone });
      else if (digitsOf(phone.number).includes(digits)) numberMatches.push({ contact, phone });
    }
    if (nameMatches.length >= limit) break;
  }

  return [...nameMatches, ...numberMatches].slice(0, limit);
}
