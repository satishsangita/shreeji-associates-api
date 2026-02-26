import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/app-auth-context";

type Screen = "login" | "register";

export default function AuthScreen() {
  const colors = useColors();
  const { login } = useAppAuth();
  const [screen, setScreen] = useState<Screen>("login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const loginMutation = trpc.appAuth.login.useMutation();
  const registerMutation = trpc.appAuth.register.useMutation();

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }
    setLoggingIn(true);
    try {
      const result = await loginMutation.mutateAsync({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      await login(result.token, result.user);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid email or password.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    if (regPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    setRegistering(true);
    try {
      const result = await registerMutation.mutateAsync({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
      });
      // If user is admin (auto-approved), log them in directly
      if (result.user.status === "approved") {
        await login(result.token, result.user);
      } else {
        // Regular member — show pending approval message
        setRegistered(true);
      }
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Could not connect to server.");
    } finally {
      setRegistering(false);
    }
  };

  const s = styles(colors);

  // Pending approval screen after registration
  if (registered) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.pendingContainer}>
          <View style={s.pendingIcon}>
            <Text style={s.pendingIconText}>⏳</Text>
          </View>
          <Text style={[s.pendingTitle, { color: colors.foreground }]}>Registration Submitted</Text>
          <Text style={[s.pendingText, { color: colors.muted }]}>
            Your account is pending approval from the admin.{"\n"}
            You will be able to access the app once approved.
          </Text>
          <TouchableOpacity
            style={[s.switchBtn, { borderColor: colors.primary }]}
            onPress={() => { setRegistered(false); setScreen("login"); }}
            activeOpacity={0.8}
          >
            <Text style={[s.switchBtnText, { color: colors.primary }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <View style={s.header}>
            <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={s.logoText}>SA</Text>
            </View>
            <Text style={[s.appName, { color: colors.foreground }]}>Shreeji Associates</Text>
            <Text style={[s.appTagline, { color: colors.muted }]}>Legal Document Management</Text>
          </View>

          {/* Tab switcher */}
          <View style={[s.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[s.tab, screen === "login" && { backgroundColor: colors.primary }]}
              onPress={() => setScreen("login")}
              activeOpacity={0.85}
            >
              <Text style={[s.tabText, { color: screen === "login" ? "#FFFFFF" : colors.muted }]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, screen === "register" && { backgroundColor: colors.primary }]}
              onPress={() => setScreen("register")}
              activeOpacity={0.85}
            >
              <Text style={[s.tabText, { color: screen === "register" ? "#FFFFFF" : colors.muted }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          {screen === "login" && (
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.cardTitle, { color: colors.foreground }]}>Welcome Back</Text>
              <Text style={[s.cardSubtitle, { color: colors.muted }]}>Sign in to your account</Text>

              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: colors.muted }]}>Email Address</Text>
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted + "80"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: colors.muted }]}>Password</Text>
                <View style={s.pwRow}>
                  <TextInput
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Enter password"
                    placeholderTextColor={colors.muted + "80"}
                    secureTextEntry={!showLoginPw}
                    style={[s.inputPw, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={[s.eyeBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowLoginPw(!showLoginPw)}
                  >
                    <Text style={{ color: colors.muted, fontSize: 16 }}>{showLoginPw ? "🙈" : "👁"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: loggingIn ? colors.muted : colors.primary }]}
                onPress={handleLogin}
                disabled={loggingIn}
                activeOpacity={0.85}
              >
                {loggingIn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.primaryBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setScreen("register")} style={s.switchLink}>
                <Text style={[s.switchLinkText, { color: colors.muted }]}>
                  Don't have an account?{" "}
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Register here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Register Form */}
          {screen === "register" && (
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.cardTitle, { color: colors.foreground }]}>Create Account</Text>
              <Text style={[s.cardSubtitle, { color: colors.muted }]}>Register to join the team</Text>

              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: colors.muted }]}>Full Name</Text>
                <TextInput
                  value={regName}
                  onChangeText={setRegName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.muted + "80"}
                  autoCapitalize="words"
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: colors.muted }]}>Email Address</Text>
                <TextInput
                  value={regEmail}
                  onChangeText={setRegEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted + "80"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: colors.muted }]}>Password</Text>
                <View style={s.pwRow}>
                  <TextInput
                    value={regPassword}
                    onChangeText={setRegPassword}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={colors.muted + "80"}
                    secureTextEntry={!showRegPw}
                    style={[s.inputPw, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity
                    style={[s.eyeBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowRegPw(!showRegPw)}
                  >
                    <Text style={{ color: colors.muted, fontSize: 16 }}>{showRegPw ? "🙈" : "👁"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[s.infoBox, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "40" }]}>
                <Text style={[s.infoText, { color: colors.foreground }]}>
                  After registering, your account will be reviewed by the admin before you can access the app.
                </Text>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: registering ? colors.muted : colors.primary }]}
                onPress={handleRegister}
                disabled={registering}
                activeOpacity={0.85}
              >
                {registering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.primaryBtnText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setScreen("login")} style={s.switchLink}>
                <Text style={[s.switchLinkText, { color: colors.muted }]}>
                  Already have an account?{" "}
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
    header: { alignItems: "center", paddingTop: 24, paddingBottom: 28 },
    logoCircle: {
      width: 72, height: 72, borderRadius: 20,
      alignItems: "center", justifyContent: "center",
      marginBottom: 14, elevation: 4,
      shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18, shadowRadius: 8,
    },
    logoText: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1 },
    appName: { fontSize: 22, fontWeight: "800", letterSpacing: 0.3 },
    appTagline: { fontSize: 13, marginTop: 4 },
    tabBar: {
      flexDirection: "row", borderRadius: 14, borderWidth: 1,
      padding: 4, marginBottom: 20,
    },
    tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
    tabText: { fontSize: 14, fontWeight: "700" },
    card: {
      borderRadius: 20, borderWidth: 1, padding: 20,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
    cardSubtitle: { fontSize: 13, marginBottom: 20 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: {
      borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15,
    },
    pwRow: { flexDirection: "row", gap: 8 },
    inputPw: {
      flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15,
    },
    eyeBtn: {
      width: 48, borderWidth: 1, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
    },
    primaryBtn: {
      borderRadius: 14, paddingVertical: 15, alignItems: "center",
      marginTop: 8, marginBottom: 4,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
    },
    primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },
    switchLink: { alignItems: "center", paddingTop: 14 },
    switchLinkText: { fontSize: 13, textAlign: "center" },
    infoBox: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
    infoText: { fontSize: 12, lineHeight: 18 },
    // Pending screen
    pendingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    pendingIcon: { marginBottom: 20 },
    pendingIconText: { fontSize: 56 },
    pendingTitle: { fontSize: 22, fontWeight: "800", marginBottom: 12, textAlign: "center" },
    pendingText: { fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 32 },
    switchBtn: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
    switchBtnText: { fontSize: 15, fontWeight: "700" },
  });
