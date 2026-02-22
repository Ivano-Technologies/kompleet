/**
 * Home: expense list (SQLite), pull-to-refresh sync, edit/delete, offline/pending indicators.
 */
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getUserId } from "@/lib/auth/user-id";
import {
  listExpenses,
  deleteExpense,
  type ExpenseRow,
} from "@/lib/db/expense-repository";
import { getCategoryNameById } from "@/lib/db/categories";
import { runSync, getLastSyncedAt } from "@/lib/sync/sync-engine";
import { getSupabaseClient } from "@/lib/supabase/client";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

function formatDate(d: string): string {
  return d.slice(0, 10);
}

function formatAmount(amount: number, currency: string): string {
  return `${currency === "NGN" ? "₦" : currency} ${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const loadExpenses = useCallback(() => {
    getUserId().then((userId) => {
      setExpenses(listExpenses(userId));
      setLastSynced(getLastSyncedAt());
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      fetch(`${API_BASE}/api/health`)
        .then((r) => {
          const ok = r.ok;
          setIsOnline(ok);
          if (ok) {
            getSupabaseClient()
              .then((supabase) => runSync(supabase))
              .then(() => loadExpenses())
              .catch(() => {});
          }
        })
        .catch(() => setIsOnline(false));
    }, [loadExpenses]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const ok = await fetch(`${API_BASE}/api/health`)
        .then((r) => r.ok)
        .catch(() => false);
      setIsOnline(ok);
      if (ok) {
        try {
          const supabase = getSupabaseClient();
          await runSync(supabase);
        } catch {
          // no session or Supabase not configured
        }
      }
      loadExpenses();
    } finally {
      setRefreshing(false);
    }
  }, [loadExpenses]);

  const onDelete = useCallback(
    (item: ExpenseRow) => {
      Alert.alert(
        "Delete expense",
        `Remove ${item.vendor || "this expense"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteExpense(item.id);
              loadExpenses();
            },
          },
        ],
      );
    },
    [loadExpenses],
  );

  const renderItem = useCallback(
    ({ item }: { item: ExpenseRow }) => {
      const categoryName = getCategoryNameById(item.category_id);
      const isPending = item.sync_status === "pending";
      return (
        <Pressable
          style={styles.row}
          onPress={() => router.push(`/receipt-edit/${item.id}`)}
          onLongPress={() => onDelete(item)}
        >
          <View style={styles.rowMain}>
            <Text style={styles.rowVendor} numberOfLines={1}>
              {item.vendor || "No vendor"}
            </Text>
            <Text style={styles.rowMeta}>
              {formatDate(item.date)}
              {categoryName ? ` · ${categoryName}` : ""}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowAmount}>
              {formatAmount(item.amount, item.currency)}
            </Text>
            {isPending && <Text style={styles.pendingBadge}>Pending sync</Text>}
          </View>
        </Pressable>
      );
    },
    [router, onDelete],
  );

  const keyExtractor = useCallback((item: ExpenseRow) => item.id, []);

  return (
    <View style={styles.container}>
      {isOnline === false && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {"You're offline. Changes will sync when back online."}
          </Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        {lastSynced && (
          <Text style={styles.lastSynced}>
            Last synced: {new Date(lastSynced).toLocaleString()}
          </Text>
        )}
      </View>
      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          expenses.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#008751"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySub}>
              Scan a receipt or add from Scan tab
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  offlineBanner: {
    backgroundColor: "#F59E0B",
    padding: 10,
    alignItems: "center",
  },
  offlineText: { color: "#000", fontSize: 13, fontWeight: "500" },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "600", color: "#008751" },
  lastSynced: { fontSize: 12, color: "#666", marginTop: 4 },
  list: { paddingBottom: 24 },
  emptyList: { flex: 1 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#333" },
  emptySub: { fontSize: 14, color: "#666", marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  rowMain: { flex: 1, marginRight: 12 },
  rowVendor: { fontSize: 16, fontWeight: "600", color: "#000" },
  rowMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  rowAmount: { fontSize: 16, fontWeight: "600", color: "#008751" },
  pendingBadge: { fontSize: 11, color: "#F59E0B", marginTop: 4 },
});
