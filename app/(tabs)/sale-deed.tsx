import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, ScrollView, Alert, ActivityIndicator, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { exportToExcel } from "@/lib/excel-export";

interface FormState {
  sellerName: string;
  purchaserName: string;
  propertyDetails: string;
  sroOffice: string;
  saleDeedNumber: string;
  saleDeedPayment: string;
  saleDeedPaymentReference: string;
  saleDeedPaymentScreenshot: string;
}

type SaleDeedRecord = {
  id: number;
  sellerName: string;
  purchaserName: string;
  propertyDetails: string;
  sroOffice?: string | null;
  saleDeedNumber?: string | null;
  saleDeedPayment?: string | null;
  saleDeedPaymentReference?: string | null;
  saleDeedPaymentScreenshot?: string | null;
  createdAt: Date;
};

const EMPTY_FORM: FormState = {
  sellerName: "", purchaserName: "", propertyDetails: "",
  sroOffice: "", saleDeedNumber: "", saleDeedPayment: "",
  saleDeedPaymentReference: "", saleDeedPaymentScreenshot: "",
};

export default function SaleDeedScreen() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<SaleDeedRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: records = [], isLoading, refetch } = trpc.saleDeeds.list.useQuery();
  const createMutation = trpc.saleDeeds.create.useMutation({
    onSuccess: () => { refetch(); closeModal(); },
  });
  const updateMutation = trpc.saleDeeds.update.useMutation({
    onSuccess: () => { refetch(); closeModal(); },
  });
  const deleteMutation = trpc.saleDeeds.delete.useMutation({ onSuccess: () => refetch() });
  const uploadMutation = trpc.upload.image.useMutation();

  const openAdd = () => { setForm(EMPTY_FORM); setEditRecord(null); setModalVisible(true); };
  const openEdit = (r: SaleDeedRecord) => {
    setForm({
      sellerName: r.sellerName, purchaserName: r.purchaserName,
      propertyDetails: r.propertyDetails, sroOffice: r.sroOffice ?? "",
      saleDeedNumber: r.saleDeedNumber ?? "", saleDeedPayment: r.saleDeedPayment ?? "",
      saleDeedPaymentReference: r.saleDeedPaymentReference ?? "",
      saleDeedPaymentScreenshot: r.saleDeedPaymentScreenshot ?? "",
    });
    setEditRecord(r);
    setModalVisible(true);
  };
  const closeModal = () => { setModalVisible(false); setEditRecord(null); setForm(EMPTY_FORM); };

  const filtered = records.filter((r) =>
    r.sellerName.toLowerCase().includes(search.toLowerCase()) ||
    r.purchaserName.toLowerCase().includes(search.toLowerCase()) ||
    (r.saleDeedNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const pickImage = async (source: "gallery" | "camera") => {
    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Please allow camera access."); return; }
      result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Please allow photo library access."); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true });
    }
    if (!result.canceled && result.assets[0]?.base64) {
      setUploadingImage(true);
      try {
        const { url } = await uploadMutation.mutateAsync({
          base64: result.assets[0].base64,
          mimeType: result.assets[0].mimeType ?? "image/jpeg",
          folder: "sale-deed-screenshots",
        });
        setForm((f) => ({ ...f, saleDeedPaymentScreenshot: url }));
      } catch (e: any) {
        Alert.alert("Upload Failed", e.message ?? "Could not upload image.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = useCallback(async () => {
    if (!form.sellerName || !form.purchaserName || !form.propertyDetails) {
      Alert.alert("Required", "Please fill Seller Name, Purchaser Name, and Property Details."); return;
    }
    setSaving(true);
    try {
      const payload = {
        sellerName: form.sellerName, purchaserName: form.purchaserName,
        propertyDetails: form.propertyDetails, sroOffice: form.sroOffice || undefined,
        saleDeedNumber: form.saleDeedNumber || undefined, saleDeedPayment: form.saleDeedPayment || undefined,
        saleDeedPaymentReference: form.saleDeedPaymentReference || undefined,
        saleDeedPaymentScreenshot: form.saleDeedPaymentScreenshot || undefined,
      };
      if (editRecord) { await updateMutation.mutateAsync({ id: editRecord.id, ...payload }); }
      else { await createMutation.mutateAsync(payload); }
    }
    catch (e: any) { Alert.alert("Error", e.message || "Failed to save."); }
    finally { setSaving(false); }
  }, [form, editRecord]);

  const handleDelete = (id: number) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const handleExport = () => {
    const exportData = records.map((r) => ({
      "Seller Name": r.sellerName,
      "Purchaser Name": r.purchaserName,
      "Property Details": r.propertyDetails,
      "SRO Office": r.sroOffice || "",
      "Sale Deed Number": r.saleDeedNumber || "",
      "Sale Deed Payment": r.saleDeedPayment || "",
      "Payment Reference": r.saleDeedPaymentReference || "",
      "Date Added": new Date(r.createdAt).toLocaleDateString("en-IN"),
    }));
    exportToExcel(exportData, "Sale Deeds", "SaleDeeds_ShreejiAssociates");
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Sale Deeds</Text>
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
            onPress={openAdd} activeOpacity={0.85}
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
          placeholder="Search by seller, purchaser, deed no..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      {/* Records List */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="doc.plaintext" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>No records yet</Text>
          <Text style={[styles.emptySubText, { color: colors.muted }]}>Tap "Add" to create a sale deed entry</Text>
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
                    <View style={[styles.badge, { backgroundColor: colors.accent + "30" }]}>
                      <IconSymbol name="doc.plaintext" size={12} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardParty, { color: colors.foreground }]} numberOfLines={1}>{item.sellerName}</Text>
                      <Text style={[styles.cardSub, { color: colors.muted }]} numberOfLines={1}>→ {item.purchaserName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                      <IconSymbol name="trash" size={15} color={colors.error} />
                    </TouchableOpacity>
                    <IconSymbol name={expanded ? "chevron.up" : "chevron.down"} size={14} color={colors.muted} />
                  </View>
                  <View style={styles.cardRow}>
                    <IconSymbol name="building.2" size={13} color={colors.muted} />
                    <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.sroOffice || "SRO not set"}</Text>
                    <Text style={[styles.cardDate, { color: colors.muted }]}>
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  {item.saleDeedNumber ? (
                    <View style={styles.cardRow}>
                      <IconSymbol name="number" size={13} color={colors.muted} />
                      <Text style={[styles.cardMeta, { color: colors.muted }]}>Deed No: {item.saleDeedNumber}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>

                {expanded && (
                  <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                    <DetailRow label="Property Details" value={item.propertyDetails} colors={colors} />
                    {item.saleDeedPayment ? <DetailRow label="Sale Deed Payment" value={item.saleDeedPayment} colors={colors} /> : null}
                    {item.saleDeedPaymentReference ? <DetailRow label="Payment Reference" value={item.saleDeedPaymentReference} colors={colors} /> : null}
                    {item.saleDeedPaymentScreenshot ? (
                      <View>
                        <Text style={[styles.detailLabel, { color: colors.muted }]}>Payment Screenshot</Text>
                        <Image source={{ uri: item.saleDeedPaymentScreenshot }} style={styles.screenshotThumb} resizeMode="contain" />
                      </View>
                    ) : null}
                    <View style={styles.cardActionRow}>
                      <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary + "15" }]} onPress={() => openEdit(item)}>
                        <Text style={[styles.editBtnText, { color: colors.primary }]}>✏️ Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editRecord ? "Edit Sale Deed" : "New Sale Deed"}</Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={26} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SectionTitle title="Parties" colors={colors} />
              <FormField label="Seller Name *" value={form.sellerName} onChangeText={set("sellerName")} placeholder="Full name of seller / vendor" colors={colors} />
              <FormField label="Purchaser Name *" value={form.purchaserName} onChangeText={set("purchaserName")} placeholder="Full name of purchaser / buyer" colors={colors} />

              <SectionTitle title="Property Details" colors={colors} />
              <FormField label="Property Details *" value={form.propertyDetails} onChangeText={set("propertyDetails")} placeholder="Survey no, plot no, address, area, boundaries..." colors={colors} multiline />

              <SectionTitle title="Registration Details" colors={colors} />
              <FormField label="SRO Office" value={form.sroOffice} onChangeText={set("sroOffice")} placeholder="e.g. SRO Ahmedabad-1" colors={colors} />
              <FormField label="Sale Deed Number" value={form.saleDeedNumber} onChangeText={set("saleDeedNumber")} placeholder="e.g. SD-2024-001" colors={colors} />
              <FormField label="Sale Deed Payment" value={form.saleDeedPayment} onChangeText={set("saleDeedPayment")} placeholder="Stamp duty, registration fee, total amount..." colors={colors} multiline />
              <FormField label="Sale Deed Payment Reference" value={form.saleDeedPaymentReference} onChangeText={set("saleDeedPaymentReference")} placeholder="Challan no, UTR, transaction ID..." colors={colors} />

              {/* Payment Screenshot Upload */}
              <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 6 }]}>Payment Screenshot</Text>
              {form.saleDeedPaymentScreenshot ? (
                <View style={{ marginBottom: 14 }}>
                  <Image source={{ uri: form.saleDeedPaymentScreenshot }} style={styles.previewImage} resizeMode="contain" />
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: colors.error + "15" }]}
                    onPress={() => setForm((f) => ({ ...f, saleDeedPaymentScreenshot: "" }))}
                  >
                    <Text style={[styles.removeBtnText, { color: colors.error }]}>Remove Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerRow}>
                  <TouchableOpacity
                    style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() => pickImage("gallery")} disabled={uploadingImage}
                  >
                    {uploadingImage ? <ActivityIndicator size="small" color={colors.primary} /> : (
                      <Text style={[styles.imagePickerBtnText, { color: colors.primary }]}>📁 Gallery</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() => pickImage("camera")} disabled={uploadingImage}
                  >
                    <Text style={[styles.imagePickerBtnText, { color: colors.primary }]}>📷 Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: saving ? colors.border : colors.primary }]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editRecord ? "Update Record" : "Save Record"}</Text>}
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
  cardParty: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 1 },
  deleteBtn: { padding: 4 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardMeta: { fontSize: 13, flex: 1 },
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
  imagePickerRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  imagePickerBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  imagePickerBtnText: { fontSize: 14, fontWeight: "600" },
  previewImage: { width: "100%", height: 160, borderRadius: 10, backgroundColor: "#F3F4F6", marginBottom: 8 },
  removeBtn: { borderRadius: 8, paddingVertical: 8, alignItems: "center", marginBottom: 14 },
  removeBtnText: { fontSize: 13, fontWeight: "600" },
  screenshotThumb: { width: "100%", height: 120, borderRadius: 8, backgroundColor: "#F3F4F6", marginTop: 4 },
  cardActionRow: { flexDirection: "row", marginTop: 10 },
  editBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  editBtnText: { fontSize: 13, fontWeight: "600" },
});
