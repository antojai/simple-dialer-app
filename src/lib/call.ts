import { Alert, Linking } from 'react-native';

import { sanitizeDialString } from '@/lib/phone';
import { lookupName } from '@/state/contacts';
import { addRecent } from '@/state/recents';

/**
 * Hands the number to the system phone app via a `tel:` link and records it in Recents.
 * Returns false when nothing was dialed.
 */
export async function placeCall(rawNumber: string, name?: string | null): Promise<boolean> {
  const number = sanitizeDialString(rawNumber);
  if (!number) return false;

  try {
    // `#` starts a URL fragment, so it has to be escaped inside a tel: link.
    await Linking.openURL(`tel:${number.replace(/#/g, '%23')}`);
  } catch {
    Alert.alert(
      "Can't place call",
      'This device cannot make phone calls. Simulators and tablets without a SIM usually cannot.'
    );
    return false;
  }

  addRecent({ number, name: name ?? lookupName(number) });
  return true;
}
