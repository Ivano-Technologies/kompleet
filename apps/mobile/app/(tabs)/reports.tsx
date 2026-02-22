/**
 * Reports: export expenses by date range. CSV from local SQLite + share; link to web for PDF/Excel.
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  ScrollView,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getUserId } from '@/lib/auth/user-id';
import { listExpensesInRange } from '@/lib/db/expense-repository';
import { getCategoryNameById } from '@/lib/db/categories';

const WEB_REPORTS_PATH = '/reports/expense-reports';
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ReportsScreen() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    if (exporting) return;
    if (!startDate || !endDate) {
      Alert.alert('Date range', 'Please set start and end date.');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('Date range', 'Start date must be before end date.');
      return;
    }
    setExporting(true);
    try {
      const userId = await getUserId();
      if (!userId) {
        Alert.alert('Export', 'Sign in to export.');
        return;
      }
      const rows = listExpensesInRange(userId, startDate, endDate);
      const header = 'Date,Amount,Currency,Category,Vendor,VAT,Notes\n';
      const body = rows
        .map(
          (r) =>
            `${r.date},${r.amount},${r.currency},${escapeCsv(getCategoryNameById(r.category_id))},${escapeCsv(r.vendor ?? '')},${r.vat_amount},${escapeCsv(r.notes ?? '')}`
        )
        .join('\n');
      const csv = header + body;
      const filename = `expenses_${startDate}_${endDate}.csv`;
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: 'Share expense report',
        });
      } else {
        Alert.alert('Export', `CSV saved to cache: ${filename}`);
      }
    } catch (e) {
      Alert.alert('Export failed', String(e));
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, exporting]);

  const openWebReports = useCallback(() => {
    const url = `${API_BASE}${WEB_REPORTS_PATH}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open browser'));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Expense Reports</Text>
      <Text style={styles.subtitle}>Export by date range</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Start date</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>End date</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
        />
      </View>

      <Pressable
        style={[styles.button, exporting && styles.buttonDisabled]}
        onPress={handleExportCsv}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Export CSV & Share</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        CSV is generated from your local expenses. For PDF or Excel, open the web app.
      </Text>

      <Pressable style={styles.linkButton} onPress={openWebReports}>
        <Text style={styles.linkText}>Open expense reports in browser</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '600', color: '#008751' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  field: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#008751',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { marginTop: 12, fontSize: 12, color: '#666' },
  linkButton: { marginTop: 16, paddingVertical: 8 },
  linkText: { color: '#008751', fontSize: 14 },
});
