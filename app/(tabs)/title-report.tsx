import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { exportToExcel } from "@/lib/excel-export";

interface FormState {
  srNo: string;
  bankName: string;
  partyName: string;
  loanNumber: string;
  propertyDetails: string;
}

const EMPTY_FORM: FormState = {
  srNo: "", bankName: "", partyName: "", loanNumber: "", propertyDetails: "",
};

export default function TitleReportScreen() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading, refetch } = trpc.titleReports.list.useQuery();
  const createMutation = trpc.titleReports.create.useMutation({
    onSuccess: () => { refetch(); setModalVisible(false); setForm(EMPTY_FORM); },
  });
  const deleteMutation = trpc.titleReports.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = records.filter((r) =>
    r.partyName.toLowerCase().includes(search.toLowerCase()) ||
    r.bankName.toLowerCase().includes(search.toLowerCase()) ||
    r.srNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = useCallback(async () => {
    if (!form.srNo || !form.bankName || !form.partyName || !form.loanNumber || !form.propertyDetails) {
      Alert.alert("Required", "Please fill all fields."); return;
    }
    setSaving(true);
    try { await createMutation.mutateAsync(form); }
    catch (e: any) { Alert.alert("Error", e.message || "Failed to save."); }
    finally { setSaving(false); }
  }, [form]);

  const handleDelete = (id: number) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const handleExport = () => {
    const exportData = records.map((r) => ({
      "Sr. No": r.srNo,
      "Bank Name": r.bankName,
      "Party Name": r.partyName,
      "Loan Number": r.loanNumber,
      "Property Details": r.propertyDetails,
      "Date Added": new Date(r.createdAt).toLocaleDateString("en-IN"),
    }));
    exportToExcel(exportData, "Title Reports", "TitleReports_ShreejiAssociates");
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Title Reports</Text>
          <Text style={styles.headerSub}>{records.length} records</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
            onPress={handleExport} activeOpacity={0.8}
          >
            <IconSymbol name="arrow.down.doc.fill" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => setModalVisible(true)} activeOpacity={0.85}
          >
            <IconSymbol name="plus" size={18} color="#1A3C8F" />
            <Text style={[styles.addBtnText, { color: "#1A3C8F" }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
        <TextInput
          value={search} onChangeText={setSearch}
          placeholder="Search by party, bank, sr. no..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      {/* Records List */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="doc.text" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>No records yet</Text>
          <Text style={[styles.emptySubText, { color: colors.muted }]}>Tap "Add" to create a title report entry</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.srBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.srText, { color: colors.primary }]}>#{item.srNo}</Text>
                </View>
                <Text style={[styles.cardDate, { color: colors.muted }]}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <IconSymbol name="trash" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardParty, { color: colors.foreground }]}>{item.partyName}</Text>
              <View style={styles.cardRow}>
                <IconSymbol name="building.2" size={13} color={colors.muted} />
                <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.bankName}</Text>
              </View>
              <View style={styles.cardRow}>
                <IconSymbol name="number" size={13} color={colors.muted} />
                <Text style={[styles.cardMeta, { color: colors.muted }]}>Loan: {item.loanNumber}</Text>
              </View>
              <View style={[styles.propertyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.propertyLabel, { color: colors.muted }]}>Property Details</Text>
                <Text style={[styles.propertyText, { color: colors.foreground }]}>{item.propertyDetails}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Title Report</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setForm(EMPTY_FORM); }} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={26} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <FormField label="Sr. No *" value={form.srNo} onChangeText={(v: string) => setForm((f) => ({ ...f, srNo: v }))} placeholder="e.g. TR-001" colors={colors} />
              <FormField label="Bank Name *" value={form.bankName} onChangeText={(v: string) => setForm((f) => ({ ...f, bankName: v }))} placeholder="e.g. SBI, HDFC Bank" colors={colors} />
              <FormField label="Party Name *" value={form.partyName} onChangeText={(v: string) => setForm((f) => ({ ...f, partyName: v }))} placeholder="Borrower / Applicant name" colors={colors} />
              <FormField label="Loan Number *" value={form.loanNumber} onChangeText={(v: string) => setForm((f) => ({ ...f, loanNumber: v }))} placeholder="e.g. LN-2024-00123" colors={colors} />
              <FormField label="Property Details *" value={form.propertyDetails} onChangeText={(v: string) => setForm((f) => ({ ...f, propertyDetails: v }))} placeholder="Survey no, plot, address, area..." colors={colors} multiline />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: saving ? colors.border : colors.primary }]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Record</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function FormField({ label, value, onChangeText, placeholder, colors, multiline }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.muted + "80"}
        style={[
          styles.fieldInput,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
          multiline && styles.fieldInputMulti,
        ]}
        multiline={multiline} numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 14, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  srBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  srText: { fontSize: 12, fontWeight: "700" },
  cardDate: { fontSize: 11, flex: 1 },
  deleteBtn: { padding: 4 },
  cardParty: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardMeta: { fontSize: 13 },
  propertyBox: { marginTop: 8, borderRadius: 8, borderWidth: 1, padding: 10 },
  propertyLabel: { fontSize: 10, fontWeight: "600", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  propertyText: { fontSize: 13, lineHeight: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubText: { fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 20, paddingBottom: 40 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  fieldInputMulti: { height: 100, textAlignVertical: "top" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
