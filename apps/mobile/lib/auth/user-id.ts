/**
 * Current user id for expense ownership.
 * Placeholder: env or SecureStore. Replace with Supabase Auth when wired.
 */
import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = 'expense_user_id';

export async function getUserId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(USER_ID_KEY);
  if (stored) return stored;
  const fallback = process.env.EXPO_PUBLIC_TEST_USER_ID ?? 'local-user';
  await SecureStore.setItemAsync(USER_ID_KEY, fallback);
  return fallback;
}

export async function setUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync(USER_ID_KEY, id);
}
