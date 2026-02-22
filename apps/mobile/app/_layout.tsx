import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { NDPRConsentGate } from '@/lib/ndpr/NDPRConsentGate';
import { initDb } from '@/lib/db/init';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.error('DB init failed', e);
        setDbReady(true); // still show app so user sees error state
      });
  }, []);

  if (!dbReady) {
    return null; // or a small loading screen
  }

  return (
    <NDPRConsentGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="receipt-edit/[id]" options={{ title: 'Edit expense' }} />
      </Stack>
    </NDPRConsentGate>
  );
}
