import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  getAccessToken,
  signInWithPassword,
  signOutRemote,
} from "@/lib/auth/convex-auth";

export default function SettingsScreen() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getAccessToken()
      .then((token) => setSignedIn(Boolean(token)))
      .catch(() => setSignedIn(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSignIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
      setPassword("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }, [email, password, refresh]);

  const onSignOut = useCallback(async () => {
    setBusy(true);
    try {
      await signOutRemote();
      refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>Account</Text>
        {signedIn ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Signed in to Convex</Text>
            <Text style={styles.badgeDesc}>
              Expense sync and receipt upload use the same Path B APIs as web.
            </Text>
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={onSignOut}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign out</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Sign in</Text>
            <Text style={styles.badgeDesc}>
              Use the same email and password as the web app. Existing Kompleet
              users: sign up on web with that email first to reclaim data.
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.ng"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={onSignIn}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

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
  trustSection: { gap: 12, marginBottom: 24 },
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#008751",
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#c00", marginTop: 8, fontSize: 13 },
});
