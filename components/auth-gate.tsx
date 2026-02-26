import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppAuth } from "@/lib/app-auth-context";
import { useColors } from "@/hooks/use-colors";

/**
 * AuthGate wraps the entire app.
 * - While loading: shows a splash/spinner
 * - Not logged in: redirects to /auth
 * - Logged in but pending/rejected: shows a blocking screen
 * - Logged in and approved: renders children normally
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout } = useAppAuth();
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/auth" as any);
    }
  }, [loading, token]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>SA</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Loading...</Text>
      </View>
    );
  }

  // Not logged in — show nothing (redirect handled by useEffect)
  if (!token || !user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Logged in but pending approval
  if (user.status === "pending") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.pendingContainer}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>SA</Text>
          </View>
          <Text style={[styles.pendingTitle, { color: colors.foreground }]}>Approval Pending</Text>
          <Text style={[styles.pendingText, { color: colors.muted }]}>
            Hello {user.name},{"\n\n"}
            Your account is waiting for admin approval.{"\n"}
            Please contact the admin or check back later.
          </Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Registered as</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{user.email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.error }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={[styles.logoutBtnText, { color: colors.error }]}>Logout & Switch Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Rejected
  if (user.status === "rejected") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.pendingContainer}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>❌</Text>
          <Text style={[styles.pendingTitle, { color: colors.error }]}>Access Denied</Text>
          <Text style={[styles.pendingText, { color: colors.muted }]}>
            Your account registration was not approved.{"\n"}
            Please contact the admin for more information.
          </Text>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.error }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={[styles.logoutBtnText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Approved — render the app
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  safeArea: { flex: 1 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  logoText: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1 },
  loadingText: { fontSize: 14, marginTop: 12 },
  pendingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  pendingTitle: { fontSize: 22, fontWeight: "800", marginTop: 16, marginBottom: 12, textAlign: "center" },
  pendingText: { fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 24 },
  infoCard: {
    borderRadius: 12, borderWidth: 1, padding: 16,
    width: "100%", marginBottom: 24, alignItems: "center",
  },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: "700" },
  logoutBtn: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  logoutBtnText: { fontSize: 15, fontWeight: "700" },
});
