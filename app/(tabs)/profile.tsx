import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/app-auth-context";
import { useRouter } from "expo-router";

type AuthMode = "login" | "register";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, user, login, logout, loading } = useAppAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const loginMutation = trpc.appAuth.login.useMutation();
  const registerMutation = trpc.appAuth.register.useMutation();
  const changePasswordMutation = trpc.appAuth.changePassword.useMutation();

  const handleSubmit = async () => {
    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();
    if (!emailTrimmed || !password) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }
    if (mode === "register" && nameTrimmed.length < 2) {
      Alert.alert("Invalid name", "Name must be at least 2 characters.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        const result = await loginMutation.mutateAsync({ email: emailTrimmed, password });
        await login(result.token, result.user as any);
      } else {
        const result = await registerMutation.mutateAsync({ name: nameTrimmed, email: emailTrimmed, password });
        await login(result.token, result.user as any);
        if (result.user.status === "pending") {
          Alert.alert(
            "Registration Successful",
            "Your account is pending admin approval. You will be notified once approved.",
          );
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert("Required", "Please fill in both fields.");
      return;
    }
    if (newPw.length < 6) {
      Alert.alert("Weak Password", "New password must be at least 6 characters.");
      return;
    }
    setChangingPw(true);
    try {
      await changePasswordMutation.mutateAsync({
        token: token!,
        currentPassword: currentPw,
        newPassword: newPw,
      });
      Alert.alert("Success", "Password changed successfully.");
      setCurrentPw("");
      setNewPw("");
      setShowChangePw(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not change password.");
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive", onPress: async () => {
          await logout();
          router.replace("/auth" as any);
        }
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // ── Logged in view ──────────────────────────────────────────────────────────
  if (user && token) {
    const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const statusColor = user.status === "approved" ? colors.success : user.status === "rejected" ? colors.error : colors.warning;
    const statusLabel = user.status === "approved" ? "Active" : user.status === "rejected" ? "Rejected" : "Pending Approval";

    return (
      <ScreenContainer containerClassName="bg-primary">
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
          {/* Avatar + name */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>{user.email}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Pending notice */}
          {user.status === "pending" && (
            <View style={[styles.noticeCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
              <IconSymbol name="clock.fill" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: colors.warning }]}>Awaiting Admin Approval</Text>
                <Text style={[styles.noticeText, { color: colors.muted }]}>
                  Your account is pending approval from the admin. You will have full access once approved.
                </Text>
              </View>
            </View>
          )}

          {/* Rejected notice */}
          {user.status === "rejected" && (
            <View style={[styles.noticeCard, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: colors.error }]}>Access Denied</Text>
                <Text style={[styles.noticeText, { color: colors.muted }]}>
                  Your account request was rejected. Please contact the admin for more information.
                </Text>
              </View>
            </View>
          )}

          {/* Role card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoCardTitle, { color: colors.muted }]}>ACCOUNT DETAILS</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Role</Text>
              <View style={[styles.roleBadge, { backgroundColor: user.role === "admin" ? colors.primary + "20" : colors.surface }]}>
                <Text style={[styles.roleText, { color: user.role === "admin" ? colors.primary : colors.foreground }]}>
                  {user.role === "admin" ? "Administrator" : "Team Member"}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user.email}</Text>
            </View>
          </View>

          {/* Admin panel button */}
          {user.role === "admin" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/admin-panel" as any)}
              activeOpacity={0.85}
            >
              <IconSymbol name="person.2.fill" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Admin Panel — Manage Team</Text>
              <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* MIS Report button (approved members) */}
          {user.status === "approved" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => router.push("/(tabs)/mis-report" as any)}
              activeOpacity={0.85}
            >
              <IconSymbol name="doc.text.fill" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Daily MIS Work Report</Text>
              <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Change Password */}
          {user.status === "approved" && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.changePwHeader}
                onPress={() => setShowChangePw(!showChangePw)}
                activeOpacity={0.8}
              >
                <Text style={[styles.infoCardTitle, { color: colors.muted }]}>CHANGE PASSWORD</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
              {showChangePw && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    value={currentPw}
                    onChangeText={setCurrentPw}
                    placeholder="Current password"
                    placeholderTextColor={colors.muted + "80"}
                    secureTextEntry
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, marginBottom: 10 }]}
                  />
                  <TextInput
                    value={newPw}
                    onChangeText={setNewPw}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={colors.muted + "80"}
                    secureTextEntry
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, marginBottom: 12 }]}
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                  />
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: changingPw ? colors.muted : colors.primary }]}
                    onPress={handleChangePassword}
                    disabled={changingPw}
                    activeOpacity={0.85}
                  >
                    {changingPw
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={styles.actionBtnText}>Update Password</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <IconSymbol name="arrow.right.square.fill" size={18} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Auth form ───────────────────────────────────────────────────────────────
  return (
    <ScreenContainer containerClassName="bg-primary">
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{mode === "login" ? "Login" : "Create Account"}</Text>
      </View>

      <KeyboardAvoidingView
        style={[styles.content, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          {/* Logo / brand */}
          <View style={styles.brandSection}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="building.columns.fill" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.foreground }]}>Shreeji Associates</Text>
            <Text style={[styles.brandSubtitle, { color: colors.muted }]}>
              {mode === "login" ? "Sign in to your account" : "Register for team access"}
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {mode === "register" && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rahul Patel"
                  placeholderTextColor={colors.muted + "80"}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted + "80"}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Password</Text>
              <View style={[styles.passwordRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.muted + "80"}
                  style={[styles.passwordInput, { color: colors.foreground }]}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <IconSymbol name={showPassword ? "eye.slash.fill" : "eye.fill"} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: submitting ? colors.muted : colors.primary }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle mode */}
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleText, { color: colors.muted }]}>
              {mode === "login" ? "New to Shreeji Associates?" : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={() => { setMode(mode === "login" ? "register" : "login"); setPassword(""); }}>
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {mode === "login" ? " Register" : " Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "register" && (
            <Text style={[styles.approvalNote, { color: colors.muted }]}>
              Note: New registrations require admin approval before accessing the app.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
    flexDirection: "row", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formScroll: { padding: 20, paddingBottom: 40 },

  // Profile view
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#FFFFFF" },
  userName: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  noticeCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: "flex-start" },
  noticeTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  noticeText: { fontSize: 12, lineHeight: 18 },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  changePwHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoCardTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "500" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginVertical: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 14, marginBottom: 12 },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 14, borderWidth: 1.5, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: "600" },

  // Auth form
  brandSection: { alignItems: "center", paddingVertical: 28 },
  brandIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brandTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  brandSubtitle: { fontSize: 14 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  eyeBtn: { paddingHorizontal: 14 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  toggleRow: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  toggleText: { fontSize: 14 },
  toggleLink: { fontSize: 14, fontWeight: "700" },
  approvalNote: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
