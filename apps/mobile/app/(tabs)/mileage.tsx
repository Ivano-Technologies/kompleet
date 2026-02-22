/**
 * Mileage: start/end trip, compute distance (expo-location, low accuracy), save as expense (category Mileage).
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { getUserId } from "@/lib/auth/user-id";
import { createExpense } from "@/lib/db/expense-repository";
import { haversineKm } from "@/lib/mileage/distance";

const MILEAGE_CATEGORY_ID = "cat-mileage";

export default function MileageScreen() {
  const [status, setStatus] = useState<"idle" | "tracking" | "saving">("idle");
  const [startCoords, setStartCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== "granted") {
      setLastError("Location permission is required for mileage tracking.");
      return false;
    }
    setLastError(null);
    return true;
  }, []);

  const startTrip = useCallback(async () => {
    if (!(await requestPermission())) return;
    setStatus("tracking");
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      setStartCoords({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Failed to get location");
      setStatus("idle");
    }
  }, [requestPermission]);

  const endTrip = useCallback(async () => {
    if (!startCoords) return;
    setStatus("saving");
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const km = haversineKm(
        startCoords.lat,
        startCoords.lon,
        loc.coords.latitude,
        loc.coords.longitude
      );
      const userId = await getUserId();
      if (!userId) {
        setLastError("Sign in to save mileage.");
        setStatus("idle");
        setStartCoords(null);
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      createExpense(userId, {
        date: today,
        amount: 0,
        currency: "NGN",
        categoryId: MILEAGE_CATEGORY_ID,
        vendor: "Mileage",
        notes: `${km.toFixed(2)} km`,
      });
      setStartCoords(null);
      setStatus("idle");
      Alert.alert("Trip saved", `${km.toFixed(2)} km recorded as expense.`);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Failed to save trip");
      setStatus("idle");
      setStartCoords(null);
    }
  }, [startCoords]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mileage</Text>
      <Text style={styles.subtitle}>
        Start a trip to track distance (low accuracy, battery friendly).
      </Text>
      {lastError && <Text style={styles.error}>{lastError}</Text>}
      <View style={styles.actions}>
        {status === "idle" && !startCoords && (
          <Pressable style={styles.button} onPress={startTrip}>
            <Text style={styles.buttonText}>Start trip</Text>
          </Pressable>
        )}
        {status === "tracking" && startCoords && (
          <>
            <Text style={styles.tracking}>Trip started. Drive, then end trip.</Text>
            <Pressable style={[styles.button, styles.buttonEnd]} onPress={endTrip}>
              <Text style={styles.buttonText}>End trip & save</Text>
            </Pressable>
          </>
        )}
        {status === "saving" && (
          <ActivityIndicator size="large" color="#008751" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "600", color: "#008751" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  error: { marginTop: 12, color: "#b91c1c", fontSize: 14 },
  actions: { marginTop: 24 },
  button: {
    backgroundColor: "#008751",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonEnd: { marginTop: 12, backgroundColor: "#0d9488" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tracking: { fontSize: 16, color: "#333", marginBottom: 8 },
});
