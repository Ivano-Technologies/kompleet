/**
 * Manual correction screen: edit expense fields after OCR (or manual entry).
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { getExpenseById, updateExpense } from "@/lib/db/expense-repository";
import {
  getPendingReceiptUri,
  clearPendingReceiptUri,
} from "@/lib/receipt-pending-image";
import { getSignedInUserId, uploadReceipt } from "@/lib/receipt-upload";
import { listCategories, getCategoryNameById } from "@/lib/db/categories";

export default function ReceiptEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [vat, setVat] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categories = listCategories();

  useEffect(() => {
    if (!id) return;
    const row = getExpenseById(id);
    if (row) {
      setVendor(row.vendor ?? "");
      setDate(row.date ?? "");
      setAmount(String(row.amount ?? ""));
      setVat(String(row.vat_amount ?? ""));
      setNotes(row.notes ?? "");
      setCategoryId(row.category_id ?? null);
    } else {
      setError("Expense not found");
    }
    setLoading(false);
  }, [id]);

  const onSave = useCallback(async () => {
    if (!id) return;
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt < 0) {
      Alert.alert("Invalid amount", "Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      const vatNum = vat ? parseFloat(vat) : 0;
      let receiptUrl: string | undefined;
      const pendingUri = getPendingReceiptUri();
      if (pendingUri) {
        const signedInUserId = await getSignedInUserId();
        if (signedInUserId) {
          receiptUrl =
            (await uploadReceipt(pendingUri, signedInUserId, id)) ?? undefined;
        }
        clearPendingReceiptUri();
      }
      updateExpense(id, {
        vendor: vendor || undefined,
        date: date || undefined,
        amount: amt,
        vatAmount: Number.isNaN(vatNum) ? undefined : vatNum,
        notes: notes || undefined,
        receiptUrl: receiptUrl ?? undefined,
        categoryId: categoryId ?? undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [id, vendor, date, amount, vat, notes, categoryId, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008751" />
      </View>
    );
  }

  if (error && !getExpenseById(id!)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>
      <Text style={styles.label}>Vendor</Text>
      <TextInput
        style={styles.input}
        value={vendor}
        onChangeText={setVendor}
        placeholder="Store or vendor name"
        autoCapitalize="words"
      />
      <Text style={styles.label}>Category</Text>
      <Pressable
        style={styles.input}
        onPress={() => setCategoryModalVisible(true)}
      >
        <Text style={categoryId ? styles.inputText : styles.placeholder}>
          {categoryId ? getCategoryNameById(categoryId) : "Select category"}
        </Text>
      </Pressable>
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Category</Text>
            <FlatList
              data={[
                { id: null, name: "None" } as {
                  id: string | null;
                  name: string;
                },
                ...categories,
              ]}
              keyExtractor={(item) => item.id ?? "none"}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalRow}
                  onPress={() => {
                    setCategoryId(item.id);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-02-21"
        keyboardType="default"
      />
      <Text style={styles.label}>Amount (₦)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <Text style={styles.label}>VAT (₦)</Text>
      <TextInput
        style={styles.input}
        value={vat}
        onChangeText={setVat}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional notes"
        multiline
      />
      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save expense</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: { padding: 24, paddingBottom: 48 },
  backButton: { alignSelf: "flex-start", marginBottom: 16 },
  backButtonText: { fontSize: 16, color: "#008751", fontWeight: "600" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputText: { color: "#000" },
  placeholder: { color: "#888" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "50%",
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalRowText: { fontSize: 16, color: "#333" },
  notes: { minHeight: 80, textAlignVertical: "top" },
  button: {
    backgroundColor: "#008751",
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  error: { color: "#c00", marginBottom: 16, textAlign: "center" },
});
