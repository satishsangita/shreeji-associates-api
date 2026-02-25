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
  partyName: string;
  bankName: string;
  loanAmount: string;
  partyMobile: string;
  propertyDetails: string;
  paymentDetails: string;
  appointmentDate: string;
  mortgageDeedNumber: string;
  subRegistrarOffice: string;
  mortgagePaymentScreenshot: string;
  mortgageReference: string;
}

const EMPTY_FORM: FormState = {
  partyName: "", bankName: "", loanAmount: "", partyMobile: "",
  propertyDetails: "", paymentDetails: "", appointmentDate: "",
  mortgageDeedNumber: "", subRegistrarOffice: "",
  mortgagePaymentScreenshot: "", mortgageReference: "",
};

export default function MortgageDeedScreen() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: records = [], isLoading, refetch } = trpc.mortgageDeeds.list.useQuery();
  const createMutation = trpc.mortgageDeeds.create.useMutation({
    onSuccess: () => { refetch(); setModalVisible(false); setForm(EMPTY_FORM); },
  });
  const deleteMutation = trpc.mortgageDeeds.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = records.filter((r) =>
    r.partyName.toLowerCase().includes(search.toLowerCase()) ||
    r.bankName.toLowerCase().includes(search.toLowerCase()) ||
    (r.mortgageDeedNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const handleSave = useCallback(async () => {
    if (!form.partyName || !form.bankName || !form.loanAmount || !form.partyMobile || !form.propertyDetails) {
      Alert.alert("Required", "Please fill Party Name, Bank Name, Loan Amount, Mobile, and Property Details."); return;
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
      "Party Name": r.partyName,
      "Bank Name": r.bankName,
      "Loan Amount": r.loanAmount,
      "Party Mobile": r.partyMobile,
      "Property Details": r.propertyDetails,
      "Payment Details": r.paymentDetails || "",
      "Appointment Date": r.appointmentDate || "",
      "Mortgage Deed No.": r.mortgageDeedNumber || "",
      "Sub Registrar Office": r.subRegistrarOffice || "",
      "Mortgage Reference": r.mortgageReference || "",
      "Date Added": new Date(r.createdAt).toLocaleDateString("en-IN"),
    }));
    exportToExcel(exportData, "Mortgage Deeds", "MortgageDeeds_ShreejiAssociates");
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Mortgage Deeds</Text>
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
          placeholder="Search by party, bank, deed no..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      {/* Records List */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="building.columns" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>No records yet</Text>
          <Text style={[styles.emptySubText, { color: colors.muted }]}>Tap "Add" to create a mortgage deed entry</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : item.id)} activeOpacity={0.8}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
                      <IconSymbol name="building.columns" size={12} color={colors.primary} />
                    </View>
                    <Text style={[styles.cardParty, { color: colors.foreground }]} numberOfLines={1}>{item.partyName}</Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                      <IconSymbol name="trash" size={15} color={colors.error} />
                    </TouchableOpacity>
                    <IconSymbol name={expanded ? "chevron.up" : "chevron.down"} size={14} color={colors.muted} />
                  </View>
                  <View style={styles.cardRow}>
                    <IconSymbol name="building.2" size={13} color={colors.muted} />
                    <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.bankName}</Text>
                    <Text style={[styles.cardAmount, { color: colors.primary }]}>₹{item.loanAmount}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <IconSymbol name="phone" size={13} color={colors.muted} />
                    <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.partyMobile}</Text>
                    <Text style={[styles.cardDate, { color: colors.muted }]}>
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                    <DetailRow label="Property Details" value={item.propertyDetails} colors={colors} />
                    {item.paymentDetails ? <DetailRow label="Payment Details" value={item.paymentDetails} colors={colors} /> : null}
                    {item.appointmentDate ? <DetailRow label="Appointment Date" value={item.appointmentDate} colors={colors} /> : null}
                    {item.mortgageDeedNumber ? <DetailRow label="Deed Number" value={item.mortgageDeedNumber} colors={colors} /> : null}
                    {item.subRegistrarOffice ? <DetailRow label="Sub Registrar Office" value={item.subRegistrarOffice} colors={colors} /> : null}
                    {item.mortgageReference ? <DetailRow label="Mortgage Reference" value={item.mortgageReference} colors={colors} /> : null}
                    {item.mortgagePaymentScreenshot ? <DetailRow label="Payment Screenshot" value={item.mortgagePaymentScreenshot} colors={colors} /> : null}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Mortgage Deed</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setForm(EMPTY_FORM); }} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={26} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SectionTitle title="Party & Bank Details" colors={colors} />
              <FormField label="Party Name *" value={form.partyName} onChangeText={set("partyName")} placeholder="Borrower / Mortgagor name" colors={colors} />
              <FormField label="Bank Name *" value={form.bankName} onChangeText={set("bankName")} placeholder="e.g. SBI, HDFC, ICICI" colors={colors} />
              <FormField label="Loan Amount *" value={form.loanAmount} onChangeText={set("loanAmount")} placeholder="e.g. 25,00,000" colors={colors} keyboardType="numeric" />
              <FormField label="Party Mobile Number *" value={form.partyMobile} onChangeText={set("partyMobile")} placeholder="+91 98765 43210" colors={colors} keyboardType="phone-pad" />

              <SectionTitle title="Property Details" colors={colors} />
              <FormField label="Property Details *" value={form.propertyDetails} onChangeText={set("propertyDetails")} placeholder="Survey no, plot no, address, area, boundaries..." colors={colors} multiline />

              <SectionTitle title="Payment & Registration" colors={colors} />
              <FormField label="Payment Details" value={form.paymentDetails} onChangeText={set("paymentDetails")} placeholder="Stamp duty, registration fee details..." colors={colors} multiline />
              <FormField label="Appointment Date" value={form.appointmentDate} onChangeText={set("appointmentDate")} placeholder="DD/MM/YYYY" colors={colors} />
              <FormField label="Mortgage Deed Number" value={form.mortgageDeedNumber} onChangeText={set("mortgageDeedNumber")} placeholder="e.g. MD-2024-001" colors={colors} />
              <FormField label="Sub Registrar Office" value={form.subRegistrarOffice} onChangeText={set("subRegistrarOffice")} placeholder="e.g. SRO Ahmedabad-1" colors={colors} />
              <FormField label="Mortgage Payment Screenshot" value={form.mortgagePaymentScreenshot} onChangeText={set("mortgagePaymentScreenshot")} placeholder="URL or reference link" colors={colors} />
              <FormField label="Mortgage Reference" value={form.mortgageReference} onChangeText={set("mortgageReference")} placeholder="Reference number or note" colors={colors} />

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

function SectionTitle({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={[styles.sectionTitle, { borderBottomColor: colors.border }]}>
      <Text style={[styles.sectionTitleText, { color: colors.primary }]}>{title}</Text>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, colors, multiline, keyboardType }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.muted + "80"} keyboardType={keyboardType || "default"}
        style={[
          styles.fieldInput,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
          multiline && styles.fieldInputMulti,
        ]}
        multiline={multiline} numberOfLines={multiline ? 3 : 1}
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
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardParty: { fontSize: 15, fontWeight: "700", flex: 1 },
  deleteBtn: { padding: 4 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardMeta: { fontSize: 13, flex: 1 },
  cardAmount: { fontSize: 13, fontWeight: "700" },
  cardDate: { fontSize: 11 },
  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, gap: 8 },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 13, lineHeight: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubText: { fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "95%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 20, paddingBottom: 40 },
  sectionTitle: { borderBottomWidth: 0.5, paddingBottom: 6, marginBottom: 14, marginTop: 8 },
  sectionTitleText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  fieldInputMulti: { height: 80, textAlignVertical: "top" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
