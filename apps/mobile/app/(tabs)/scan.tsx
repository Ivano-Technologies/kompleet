/**
 * Scan tab: camera capture → OCR (or queue when offline) → manual correction.
 */
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNDPRConsent } from '@/lib/ndpr/NDPRConsentGate';
import { getUserId } from '@/lib/auth/user-id';
import { enqueueOcr, getPendingOcrItems, runOcrOnImage, processOcrQueue } from '@/lib/ocr/ocr-queue';
import { setPendingReceiptUri } from '@/lib/receipt-pending-image';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function ScanScreen() {
  const router = useRouter();
  const consent = useNDPRConsent();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const captureAndProcess = useCallback(async () => {
    if (!consent?.hasConsent) {
      Alert.alert('Consent required', 'Accept NDPR consent to scan receipts.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access', 'Camera permission is required to scan receipts.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        setLoading(false);
        return;
      }

      const uri = result.assets[0].uri;
      const userId = await getUserId();

      // Simple online check: try to hit OCR API (or a tiny ping). If fetch fails, assume offline.
      let isOnline = false;
      try {
        const r = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        isOnline = r.ok;
      } catch {
        isOnline = false;
      }

      if (!isOnline) {
        enqueueOcr(uri);
        const pending = getPendingOcrItems();
        setMessage(`Saved for later (${pending.length} in queue). Process when online.`);
        setLoading(false);
        return;
      }

      const ocrResult = await runOcrOnImage(
        uri,
        userId,
        API_BASE,
        async () => null
      );

      if ('error' in ocrResult) {
        const { createExpense } = await import('@/lib/db/expense-repository');
        const draft = createExpense(userId, {
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          currency: 'NGN',
          notes: 'OCR failed – please enter manually',
        });
        setMessage(`OCR failed: ${ocrResult.error}. Opening form to enter manually.`);
        setPendingReceiptUri(uri);
        router.push(`/receipt-edit/${draft.id}`);
        setLoading(false);
        return;
      }

      setPendingReceiptUri(uri);
      router.push(`/receipt-edit/${ocrResult.expenseId}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [consent, router]);

  const pendingCount = getPendingOcrItems().length;

  const onProcessQueue = useCallback(async () => {
    if (pendingCount === 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const userId = await getUserId();
      const { processed, errors } = await processOcrQueue(
        userId,
        API_BASE,
        async () => null
      );
      setMessage(
        errors.length > 0
          ? `Processed ${processed}, ${errors.length} failed.`
          : `Processed ${processed} receipt(s).`
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Queue processing failed');
    } finally {
      setLoading(false);
    }
  }, [pendingCount]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan receipt</Text>
      <Text style={styles.subtitle}>
        Take a photo to extract amount, date, and vendor.
      </Text>

      {message ? (
        <View style={styles.messageBox}>
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}

      {pendingCount > 0 && (
        <>
          <Text style={styles.pending}>
            {pendingCount} receipt(s) queued for when you're back online.
          </Text>
          <Pressable
            style={[styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={onProcessQueue}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Process queue now</Text>
          </Pressable>
        </>
      )}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={captureAndProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Open camera</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        Poor lighting? Try again in better light or enter the expense manually from Home.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#008751',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  messageBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#333',
  },
  pending: {
    fontSize: 13,
    color: '#008751',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#008751',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#008751',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: { color: '#008751', fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center', paddingHorizontal: 16 },
});
