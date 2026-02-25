import { ScrollView, Text, View, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface StatCard {
  id: string;
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface Hearing {
  id: string;
  date: string;
  caseTitle: string;
  purpose: string;
}

const STATS: StatCard[] = [
  { id: "1", label: "Open Cases", value: 2, icon: "briefcase.fill", color: "#3B82F6" },
  { id: "2", label: "Total Clients", value: 2, icon: "person.2.fill", color: "#22C55E" },
  { id: "3", label: "Upcoming Hearings", value: 2, icon: "calendar", color: "#F59E0B" },
  { id: "4", label: "Pending Cases", value: 0, icon: "clock.fill", color: "#EF4444" },
];

const HEARINGS: Hearing[] = [
  { id: "1", date: "2025-11-24", caseTitle: "Doe vs. MegaCorp", purpose: "Initial Hearing" },
  { id: "2", date: "2025-12-01", caseTitle: "State vs. Smith", purpose: "Pre-trial Conference" },
];

const QUICK_ACTIONS = [
  { id: "1", label: "New Case", icon: "briefcase.fill", color: "#1A3C8F" },
  { id: "2", label: "New Client", icon: "person.fill", color: "#22C55E" },
  { id: "3", label: "New Document", icon: "doc.fill", color: "#F5A623" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>Advocate Satish</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>SP</Text>
        </View>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.id} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconCircle, { backgroundColor: stat.color + "20" }]}>
                <IconSymbol name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionBtn, { backgroundColor: action.color }]}
              activeOpacity={0.85}
            >
              <IconSymbol name={action.icon as any} size={20} color="#FFFFFF" />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Hearings */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Hearings</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Table Header */}
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
          {HEARINGS.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No upcoming hearings</Text>
          )}
        </View>

        {/* Recent Documents */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Documents</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.emptyDocRow}>
            <IconSymbol name="doc.fill" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted, marginTop: 8 }]}>
              No documents generated yet.{"\n"}Use the tabs below to create one.
            </Text>
          </View>
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
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500", textAlign: "center", marginTop: 2 },
  quickActions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickActionBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  quickActionLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
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
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyDocRow: { alignItems: "center", paddingVertical: 20 },
});
