import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { NDPRConsentGate } from "@/lib/ndpr/NDPRConsentGate";
import { initDb } from "@/lib/db/init";
import { logger } from "@/lib/logger";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      logger.info("Development mode active", { module: "RootLayout" });
    }

    initDb()
      .then(() => setDbReady(true))
      .catch((e: unknown) => {
        logger.error("DB init failed", {
          error: e instanceof Error ? e.message : String(e),
          operation: "initDb",
        });
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
        <Stack.Screen
          name="receipt-edit/[id]"
          options={{ title: "Edit expense" }}
        />
      </Stack>
    </NDPRConsentGate>
  );
}
