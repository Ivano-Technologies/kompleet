/**
 * NDPR consent gate: block scan/sync until user accepts.
 * Shows a modal on first launch or when consent not given; children render after accept.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { hasConsent, acceptConsent } from './consent-store';

type ConsentContextValue = {
  hasConsent: boolean;
  accept: () => Promise<void>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useNDPRConsent(): ConsentContextValue | null {
  return useContext(ConsentContext);
}

export function NDPRConsentGate({
  children,
  supabase,
}: {
  children: React.ReactNode;
  supabase?: ConsentContextValue extends { accept: (s?: infer S) => Promise<void> } ? S : unknown;
}) {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    const ok = await hasConsent();
    setConsentGiven(ok);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const accept = useCallback(async () => {
    await acceptConsent(supabase as Parameters<typeof acceptConsent>[0]);
    setConsentGiven(true);
  }, [supabase]);

  if (consentGiven === null) {
    return null; // loading
  }

  const value: ConsentContextValue = {
    hasConsent: consentGiven,
    accept,
  };

  return (
    <ConsentContext.Provider value={value}>
      {consentGiven ? (
        children
      ) : (
        <Modal visible={true} animationType="slide">
          <ScrollView contentContainerStyle={styles.modal}>
            <Text style={styles.title}>Data & Privacy (NDPR)</Text>
            <Text style={styles.body}>
              Kompleet uses your data to scan receipts, sync expenses across devices, and
              generate reports. We process data in line with the Nigerian Data Protection
              Regulation (NDPR). Your data is encrypted in transit and stored securely.
            </Text>
            <Text style={styles.body}>
              By continuing, you consent to:{'\n'}
              • Receipt scanning and OCR processing{'\n'}
              • Cloud sync of your expense data
            </Text>
            <Pressable style={styles.button} onPress={accept}>
              <Text style={styles.buttonText}>I Accept</Text>
            </Pressable>
          </ScrollView>
        </Modal>
      )}
    </ConsentContext.Provider>
  );
}

const styles = StyleSheet.create({
  modal: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#008751',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#008751',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
