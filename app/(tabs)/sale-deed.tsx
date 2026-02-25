import { useState } from "react";
import {
  ScrollView, Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface SaleDeedForm {
  sellerName: string;
  sellerAddress: string;
  buyerName: string;
  buyerAddress: string;
  propertyAddress: string;
  saleAmount: string;
  advanceAmount: string;
  executionDate: string;
}

const EMPTY_FORM: SaleDeedForm = {
  sellerName: "",
  sellerAddress: "",
  buyerName: "",
  buyerAddress: "",
  propertyAddress: "",
  saleAmount: "",
  advanceAmount: "",
  executionDate: "",
};

export default function SaleDeedScreen() {
  const colors = useColors();
  const [form, setForm] = useState<SaleDeedForm>(EMPTY_FORM);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof SaleDeedForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    if (!form.sellerName || !form.buyerName || !form.propertyAddress || !form.saleAmount) {
      Alert.alert("Missing Fields", "Please fill in Seller Name, Buyer Name, Property Address, and Sale Amount.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const today = form.executionDate || new Date().toLocaleDateString("en-IN");
    const balanceAmount = form.saleAmount && form.advanceAmount
      ? `₹ ${(parseFloat(form.saleAmount.replace(/,/g, "")) - parseFloat(form.advanceAmount.replace(/,/g, ""))).toLocaleString("en-IN")}`
      : "As agreed";

    const doc = `SALE DEED
═══════════════════════════════════════

This Sale Deed is executed on ${today}

BETWEEN

THE VENDOR (SELLER):
Name    : ${form.sellerName}
Address : ${form.sellerAddress || "As per records"}
(hereinafter referred to as "the Vendor")

AND

THE PURCHASER (BUYER):
Name    : ${form.buyerName}
Address : ${form.buyerAddress || "As per records"}
(hereinafter referred to as "the Purchaser")

RECITALS
───────────────────────────────────────
The Vendor is the absolute owner of the property described hereunder and has agreed to sell the same to the Purchaser for the consideration mentioned herein.

SCHEDULE OF PROPERTY
───────────────────────────────────────
${form.propertyAddress}

CONSIDERATION
───────────────────────────────────────
Total Sale Amount  : ₹ ${form.saleAmount}
Advance Paid       : ₹ ${form.advanceAmount || "0"}
Balance Payable    : ${balanceAmount}

TERMS AND CONDITIONS
───────────────────────────────────────
1. The Vendor hereby sells, transfers, and conveys the above-described property to the Purchaser.
2. The Vendor confirms that the property is free from all encumbrances, liens, and charges.
3. The Vendor shall hand over vacant possession of the property upon receipt of full consideration.
4. The Purchaser shall bear all stamp duty and registration charges.
5. This deed is subject to the provisions of the Transfer of Property Act, 1882 and Registration Act, 1908.
6. The Vendor warrants the title to the property and shall defend the same against all claims.

IN WITNESS WHEREOF, the parties have executed this deed on the date first mentioned above.

VENDOR                          PURCHASER
${form.sellerName}              ${form.buyerName}

WITNESSES:
1. ___________________________
2. ___________________________

Prepared by:
Advocate Satish Patel
Shreeji Associates
`;
    setGenerated(doc);
    setLoading(false);
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setGenerated(null);
  };

  return (
    <ScreenContainer containerClassName="bg-primary">
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <IconSymbol name="doc.badge.plus" size={22} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Sale Deed</Text>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!generated ? (
          <>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Draft a sale deed / conveyance document
            </Text>

            {/* Seller */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Seller (Vendor)</Text>
              <InputField label="Seller Name *" value={form.sellerName}
                onChangeText={(v) => update("sellerName", v)} placeholder="Full name of seller" colors={colors} />
              <InputField label="Seller Address" value={form.sellerAddress}
                onChangeText={(v) => update("sellerAddress", v)} placeholder="Complete address" multiline colors={colors} />
            </View>

            {/* Buyer */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Buyer (Purchaser)</Text>
              <InputField label="Buyer Name *" value={form.buyerName}
                onChangeText={(v) => update("buyerName", v)} placeholder="Full name of buyer" colors={colors} />
              <InputField label="Buyer Address" value={form.buyerAddress}
                onChangeText={(v) => update("buyerAddress", v)} placeholder="Complete address" multiline colors={colors} />
            </View>

            {/* Property */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Property Details</Text>
              <InputField label="Property Address / Schedule Description *" value={form.propertyAddress}
                onChangeText={(v) => update("propertyAddress", v)}
                placeholder="Survey No., Plot No., area, location, boundaries..." multiline numberOfLines={4} colors={colors} />
            </View>

            {/* Consideration */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Consideration</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <InputField label="Sale Amount (₹) *" value={form.saleAmount}
                    onChangeText={(v) => update("saleAmount", v)} placeholder="e.g., 2500000" keyboardType="numeric" colors={colors} />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <InputField label="Advance Amount (₹)" value={form.advanceAmount}
                    onChangeText={(v) => update("advanceAmount", v)} placeholder="e.g., 500000" keyboardType="numeric" colors={colors} />
                </View>
              </View>
              <InputField label="Execution Date" value={form.executionDate}
                onChangeText={(v) => update("executionDate", v)} placeholder="DD/MM/YYYY" colors={colors} />
            </View>

            {/* Upload hint */}
            <View style={[styles.uploadHint, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <IconSymbol name="arrow.up.doc.fill" size={16} color={colors.primary} />
              <Text style={[styles.uploadHintText, { color: colors.primary }]}>
                Reference documents can be attached after generation
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: colors.accent }]}
              onPress={handleGenerate}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A3C8F" />
              ) : (
                <>
                  <IconSymbol name="doc.fill" size={18} color="#1A3C8F" />
                  <Text style={styles.generateBtnText}>Generate Sale Deed</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.reportHeader, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={[styles.reportHeaderText, { color: colors.success }]}>
                Sale Deed Generated Successfully
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.reportText, { color: colors.foreground }]}>{generated}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => Alert.alert("Print", "Printing coming soon.")} activeOpacity={0.85}>
                <IconSymbol name="printer.fill" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => Alert.alert("Share", "Sharing coming soon.")} activeOpacity={0.85}>
                <IconSymbol name="square.and.arrow.up" size={16} color="#1A3C8F" />
                <Text style={[styles.actionBtnText, { color: "#1A3C8F" }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.border }]}
                onPress={handleClear} activeOpacity={0.85}>
                <IconSymbol name="plus" size={16} color={colors.foreground} />
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>New</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function InputField({
  label, value, onChangeText, placeholder, multiline, numberOfLines, keyboardType, colors,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; numberOfLines?: number;
  keyboardType?: "default" | "numeric"; colors: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted + "80"}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType || "default"}
        style={[
          styles.input,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
          multiline && { height: numberOfLines ? numberOfLines * 22 + 16 : 80, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  scrollContent: { padding: 16, paddingTop: 18 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 5, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  row: { flexDirection: "row" },
  uploadHint: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  uploadHintText: { fontSize: 12, fontWeight: "500", flex: 1 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14, marginTop: 4, marginBottom: 8 },
  generateBtnText: { fontSize: 16, fontWeight: "700", color: "#1A3C8F" },
  reportHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  reportHeaderText: { fontSize: 14, fontWeight: "600" },
  reportText: { fontSize: 12, fontFamily: "monospace", lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
});
