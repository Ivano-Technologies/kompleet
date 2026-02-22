import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>Privacy & security</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>NDPR compliant</Text>
          <Text style={styles.badgeDesc}>
            We process your data in line with the Nigerian Data Protection
            Regulation. You gave consent for scanning and cloud sync.
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Your data is encrypted</Text>
          <Text style={styles.badgeDesc}>
            Data is encrypted in transit (HTTPS). Tokens and sensitive data are
            stored securely on device.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#008751",
    marginBottom: 24,
  },
  trustSection: { gap: 12 },
  trustTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#008751",
    borderRadius: 8,
    padding: 14,
  },
  badgeLabel: { fontSize: 14, fontWeight: "600", color: "#008751" },
  badgeDesc: { fontSize: 13, color: "#555", marginTop: 4, lineHeight: 20 },
});
