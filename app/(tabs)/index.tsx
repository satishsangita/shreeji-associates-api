import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/app-auth-context";

interface Hearing {
  id: string;
  date: string;
  caseTitle: string;
  purpose: string;
}

const HEARINGS: Hearing[] = [
  { id: "1", date: "2025-11-24", caseTitle: "Doe vs. MegaCorp", purpose: "Initial Hearing" },
  { id: "2", date: "2025-12-01", caseTitle: "State vs. Smith", purpose: "Pre-trial Conference" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAppAuth();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = user?.name ?? "Welcome";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards — navigate to respective screens */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/title-report")}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "#3B82F620" }]}>
              <IconSymbol name="doc.text.fill" size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>Title</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Title Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/mortgage-deed")}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "#22C55E20" }]}>
              <IconSymbol name="house.fill" size={22} color="#22C55E" />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>Mortgage</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Mortgage Deeds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/sale-deed")}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "#F59E0B20" }]}>
              <IconSymbol name="doc.fill" size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>Sale</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Sale Deeds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/ai-assistant")}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "#8B5CF620" }]}>
              <IconSymbol name="sparkles" size={22} color="#8B5CF6" />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>AI</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>AI Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: "#1A3C8F" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/title-report")}
          >
            <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionLabel}>Title Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: "#22C55E" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/mortgage-deed")}
          >
            <IconSymbol name="house.fill" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionLabel}>Mortgage Deed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: "#F5A623" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/sale-deed")}
          >
            <IconSymbol name="doc.fill" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionLabel}>Sale Deed</Text>
          </TouchableOpacity>
        </View>

        {/* AI Assistant Banner */}
        <TouchableOpacity
          style={[styles.aiBanner, { backgroundColor: "#1A3C8F" }]}
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/ai-assistant")}
        >
          <View style={styles.aiBannerLeft}>
            <IconSymbol name="sparkles" size={24} color="#F5A623" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.aiBannerTitle}>AI Legal Assistant</Text>
              <Text style={styles.aiBannerSub}>Ask any legal question instantly</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={18} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Upcoming Hearings */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Hearings</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: colors.muted, flex: 1.2 }]}>DATE</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.muted, flex: 2 }]}>CASE</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.muted, flex: 1.5 }]}>PURPOSE</Text>
          </View>
          {HEARINGS.map((hearing, idx) => (
            <View
              key={hearing.id}
              style={[
                styles.tableRow,
                idx < HEARINGS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.tableCell, { color: colors.muted, flex: 1.2 }]}>{hearing.date}</Text>
              <Text style={[styles.tableCell, { color: colors.primary, flex: 2, fontWeight: "600" }]}>
                {hearing.caseTitle}
              </Text>
              <Text style={[styles.tableCell, { color: colors.foreground, flex: 1.5 }]}>{hearing.purpose}</Text>
            </View>
          ))}
        </View>

        {/* Screens Navigation Cards */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Sections</Text>
        <View style={styles.navCards}>
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/title-report")}
          >
            <View style={[styles.navCardIcon, { backgroundColor: "#3B82F620" }]}>
              <IconSymbol name="doc.text.fill" size={26} color="#3B82F6" />
            </View>
            <View style={styles.navCardText}>
              <Text style={[styles.navCardTitle, { color: colors.foreground }]}>Title Report</Text>
              <Text style={[styles.navCardSub, { color: colors.muted }]}>Manage title report records</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/mortgage-deed")}
          >
            <View style={[styles.navCardIcon, { backgroundColor: "#22C55E20" }]}>
              <IconSymbol name="house.fill" size={26} color="#22C55E" />
            </View>
            <View style={styles.navCardText}>
              <Text style={[styles.navCardTitle, { color: colors.foreground }]}>Mortgage Deed</Text>
              <Text style={[styles.navCardSub, { color: colors.muted }]}>Manage mortgage deed records</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/sale-deed")}
          >
            <View style={[styles.navCardIcon, { backgroundColor: "#F59E0B20" }]}>
              <IconSymbol name="doc.fill" size={26} color="#F59E0B" />
            </View>
            <View style={styles.navCardText}>
              <Text style={[styles.navCardTitle, { color: colors.foreground }]}>Sale Deed</Text>
              <Text style={[styles.navCardSub, { color: colors.muted }]}>Manage sale deed records</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/ai-assistant")}
          >
            <View style={[styles.navCardIcon, { backgroundColor: "#8B5CF620" }]}>
              <IconSymbol name="sparkles" size={26} color="#8B5CF6" />
            </View>
            <View style={styles.navCardText}>
              <Text style={[styles.navCardTitle, { color: colors.foreground }]}>AI Assistant</Text>
              <Text style={[styles.navCardSub, { color: colors.muted }]}>Ask legal questions with AI</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1 },
  welcomeText: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  nameText: { fontSize: 22, color: "#FFFFFF", fontWeight: "700", marginTop: 2 },
  dateText: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#1A3C8F", fontWeight: "800", fontSize: 15 },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  scrollContent: { padding: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 4 },

  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500", textAlign: "center", marginTop: 2 },

  // Quick Actions
  quickActions: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickActionBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  quickActionLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "600", textAlign: "center" },

  // AI Banner
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  aiBannerLeft: { flexDirection: "row", alignItems: "center" },
  aiBannerTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  aiBannerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },

  // Hearings Table
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, marginBottom: 4 },
  tableHeaderCell: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 10 },
  tableCell: { fontSize: 13 },

  // Nav Cards
  navCards: { gap: 10, marginBottom: 10 },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  navCardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  navCardText: { flex: 1, marginLeft: 14 },
  navCardTitle: { fontSize: 15, fontWeight: "700" },
  navCardSub: { fontSize: 12, marginTop: 2 },
});
