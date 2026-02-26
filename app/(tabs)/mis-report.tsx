import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/app-auth-context";
import { useRouter } from "expo-router";

type TabType = "submit" | "history" | "all";

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

export default function MisReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, user } = useAppAuth();
  const [tab, setTab] = useState<TabType>("submit");

  // Form state
  const [reportDate, setReportDate] = useState(getTodayDate());
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [titleReportsDone, setTitleReportsDone] = useState("0");
  const [mortgageDeedsDone, setMortgageDeedsDone] = useState("0");
  const [saleDeedsDone, setSaleDeedsDone] = useState("0");
  const [courtVisits, setCourtVisits] = useState("0");
  const [clientMeetings, setClientMeetings] = useState("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitMutation = trpc.mis.submit.useMutation();
  const myReportsQuery = trpc.mis.myReports.useQuery(
    { token: token ?? "" },
    { enabled: !!token && tab === "history" },
  );
  const allReportsQuery = trpc.mis.allReports.useQuery(
    { token: token ?? "" },
    { enabled: !!token && user?.role === "admin" && tab === "all" },
  );

  if (!user || !token) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <IconSymbol name="lock.fill" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Login Required</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Please login to submit MIS reports.</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/profile" as any)}
          >
            <Text style={styles.actionBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (user.status !== "approved") {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <IconSymbol name="clock.fill" size={40} color={colors.warning} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Pending Approval</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Your account needs admin approval before you can submit MIS reports.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSubmit = async () => {
    if (!tasksCompleted.trim()) {
      Alert.alert("Missing field", "Please describe the tasks you completed today.");
      return;
    }
    if (!hoursWorked.trim()) {
      Alert.alert("Missing field", "Please enter hours worked.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitMutation.mutateAsync({
        token,
        reportDate,
        tasksCompleted: tasksCompleted.trim(),
        hoursWorked: hoursWorked.trim(),
        titleReportsDone: parseInt(titleReportsDone) || 0,
        mortgageDeedsDone: parseInt(mortgageDeedsDone) || 0,
        saleDeedsDone: parseInt(saleDeedsDone) || 0,
        courtVisits: parseInt(courtVisits) || 0,
        clientMeetings: parseInt(clientMeetings) || 0,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        result.updated ? "Report Updated" : "Report Submitted",
        result.updated
          ? "Your MIS report for today has been updated successfully."
          : "Your daily MIS report has been submitted successfully.",
        [{ text: "OK", onPress: () => { setTab("history"); myReportsQuery.refetch(); } }],
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderReportItem = ({ item }: { item: any }) => (
    <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.reportHeader}>
        <View style={[styles.dateBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.dateText, { color: colors.primary }]}>{formatDate(item.reportDate)}</Text>
        </View>
        {item.userName && (
          <Text style={[styles.reporterName, { color: colors.muted }]}>{item.userName}</Text>
        )}
        <View style={[styles.hoursBadge, { backgroundColor: colors.success + "15" }]}>
          <Text style={[styles.hoursText, { color: colors.success }]}>{item.hoursWorked}h</Text>
        </View>
      </View>

      <Text style={[styles.tasksText, { color: colors.foreground }]}>{item.tasksCompleted}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {item.titleReportsDone > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.primary + "10" }]}>
            <Text style={[styles.statChipText, { color: colors.primary }]}>📄 {item.titleReportsDone} Title</Text>
          </View>
        )}
        {item.mortgageDeedsDone > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.warning + "10" }]}>
            <Text style={[styles.statChipText, { color: colors.warning }]}>🏠 {item.mortgageDeedsDone} Mortgage</Text>
          </View>
        )}
        {item.saleDeedsDone > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.success + "10" }]}>
            <Text style={[styles.statChipText, { color: colors.success }]}>🤝 {item.saleDeedsDone} Sale</Text>
          </View>
        )}
        {item.courtVisits > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.muted + "20" }]}>
            <Text style={[styles.statChipText, { color: colors.muted }]}>⚖️ {item.courtVisits} Court</Text>
          </View>
        )}
        {item.clientMeetings > 0 && (
          <View style={[styles.statChip, { backgroundColor: colors.muted + "20" }]}>
            <Text style={[styles.statChipText, { color: colors.muted }]}>👥 {item.clientMeetings} Meetings</Text>
          </View>
        )}
      </View>

      {item.notes ? (
        <Text style={[styles.notesText, { color: colors.muted }]}>Note: {item.notes}</Text>
      ) : null}
    </View>
  );

  const NumInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <View style={styles.numField}>
      <Text style={[styles.numLabel, { color: colors.muted }]}>{label}</Text>
      <View style={styles.numRow}>
        <TouchableOpacity
          style={[styles.numBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => onChange(String(Math.max(0, parseInt(value || "0") - 1)))}
        >
          <Text style={[styles.numBtnText, { color: colors.foreground }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.numValue, { color: colors.foreground }]}>{value}</Text>
        <TouchableOpacity
          style={[styles.numBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => onChange(String(parseInt(value || "0") + 1))}
        >
          <Text style={[styles.numBtnText, { color: colors.foreground }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Daily MIS Report</Text>
          <Text style={styles.headerSubtitle}>Track your daily work</Text>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, tab === "submit" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab("submit")}
          >
            <Text style={[styles.tabText, { color: tab === "submit" ? colors.primary : colors.muted }]}>Submit Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "history" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab("history")}
          >
            <Text style={[styles.tabText, { color: tab === "history" ? colors.primary : colors.muted }]}>My Reports</Text>
          </TouchableOpacity>
          {user.role === "admin" && (
            <TouchableOpacity
              style={[styles.tab, tab === "all" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab("all")}
            >
              <Text style={[styles.tabText, { color: tab === "all" ? colors.primary : colors.muted }]}>All Team</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit form */}
        {tab === "submit" && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Report for {formatDate(reportDate)}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Tasks Completed *</Text>
                  <TextInput
                    value={tasksCompleted}
                    onChangeText={setTasksCompleted}
                    placeholder="Describe what you worked on today..."
                    placeholderTextColor={colors.muted + "80"}
                    style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Hours Worked *</Text>
                  <TextInput
                    value={hoursWorked}
                    onChangeText={setHoursWorked}
                    placeholder="e.g. 8 or 7.5"
                    placeholderTextColor={colors.muted + "80"}
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    keyboardType="decimal-pad"
                  />
                </View>

                <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Work Counts (tap +/− to adjust)</Text>
                <View style={styles.numGrid}>
                  <NumInput label="Title Reports" value={titleReportsDone} onChange={setTitleReportsDone} />
                  <NumInput label="Mortgage Deeds" value={mortgageDeedsDone} onChange={setMortgageDeedsDone} />
                  <NumInput label="Sale Deeds" value={saleDeedsDone} onChange={setSaleDeedsDone} />
                  <NumInput label="Court Visits" value={courtVisits} onChange={setCourtVisits} />
                  <NumInput label="Client Meetings" value={clientMeetings} onChange={setClientMeetings} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Additional Notes (optional)</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any other notes for today..."
                    placeholderTextColor={colors.muted + "80"}
                    style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    multiline
                    numberOfLines={2}
                  />
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
                    <>
                      <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Submit Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* My reports history */}
        {tab === "history" && (
          myReportsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (myReportsQuery.data ?? []).length === 0 ? (
            <View style={styles.center}>
              <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Reports Yet</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Submit your first daily MIS report.</Text>
            </View>
          ) : (
            <FlatList
              data={myReportsQuery.data}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderReportItem}
              contentContainerStyle={styles.listContent}
            />
          )
        )}

        {/* All team reports (admin) */}
        {tab === "all" && user.role === "admin" && (
          allReportsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (allReportsQuery.data ?? []).length === 0 ? (
            <View style={styles.center}>
              <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Team Reports</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Team members haven't submitted any reports yet.</Text>
            </View>
          ) : (
            <FlatList
              data={allReportsQuery.data}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderReportItem}
              contentContainerStyle={styles.listContent}
            />
          )
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
  },
  backArrow: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600" },
  formScroll: { padding: 16, paddingBottom: 40 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  sectionSubtitle: { fontSize: 12, fontWeight: "600", marginBottom: 12, marginTop: 4 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  numGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  numField: { width: "45%", alignItems: "center" },
  numLabel: { fontSize: 11, fontWeight: "600", marginBottom: 6, textAlign: "center" },
  numRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  numBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numBtnText: { fontSize: 18, fontWeight: "700", lineHeight: 22 },
  numValue: { fontSize: 18, fontWeight: "800", minWidth: 28, textAlign: "center" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  listContent: { padding: 16, gap: 12 },
  reportCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  reportHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dateText: { fontSize: 12, fontWeight: "700" },
  reporterName: { flex: 1, fontSize: 12, fontWeight: "600" },
  hoursBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hoursText: { fontSize: 12, fontWeight: "700" },
  tasksText: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  statChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statChipText: { fontSize: 11, fontWeight: "600" },
  notesText: { fontSize: 12, marginTop: 6, fontStyle: "italic" },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actionBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
