import { useState } from "react";
import {
  ScrollView, Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface MortgageDeedForm {
  mortgagorName: string;
  mortgagorAddress: string;
  mortgageeName: string;
  mortgageeAddress: string;
  propertySchedule: string;
  loanAmount: string;
  interestRate: string;
  repaymentPeriod: string;
  executionDate: string;
}

const EMPTY_FORM: MortgageDeedForm = {
  mortgagorName: "",
  mortgagorAddress: "",
  mortgageeName: "",
  mortgageeAddress: "",
  propertySchedule: "",
  loanAmount: "",
  interestRate: "",
  repaymentPeriod: "",
  executionDate: "",
};

export default function MortgageDeedScreen() {
  const colors = useColors();
  const [form, setForm] = useState<MortgageDeedForm>(EMPTY_FORM);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof MortgageDeedForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    if (!form.mortgagorName || !form.mortgageeName || !form.loanAmount) {
      Alert.alert("Missing Fields", "Please fill in Mortgagor Name, Mortgagee Name, and Loan Amount.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const today = form.executionDate || new Date().toLocaleDateString("en-IN");
    const doc = `MORTGAGE DEED
═══════════════════════════════════════

This Mortgage Deed is executed on ${today}

BETWEEN

THE MORTGAGOR:
Name    : ${form.mortgagorName}
Address : ${form.mortgagorAddress || "As per records"}

AND

THE MORTGAGEE:
Name    : ${form.mortgageeName}
Address : ${form.mortgageeAddress || "As per records"}

WHEREAS the Mortgagor is the absolute owner of the property described hereunder and is desirous of borrowing a sum of money from the Mortgagee.

LOAN DETAILS
───────────────────────────────────────
Principal Amount : ₹ ${form.loanAmount}
Rate of Interest : ${form.interestRate || "12"}% per annum
Repayment Period : ${form.repaymentPeriod || "12"} months

SCHEDULE OF PROPERTY
───────────────────────────────────────
${form.propertySchedule || "As described in the title documents."}

TERMS AND CONDITIONS
───────────────────────────────────────
1. The Mortgagor hereby mortgages the above-described property to the Mortgagee as security for the repayment of the loan.
2. The Mortgagor shall repay the principal amount along with interest within the agreed period.
3. In case of default, the Mortgagee shall have the right to enforce the mortgage.
4. The Mortgagor shall keep the property insured and maintain it in good condition.
5. This deed shall be governed by the Transfer of Property Act, 1882.

IN WITNESS WHEREOF, the parties have signed this deed on the date mentioned above.

MORTGAGOR                    MORTGAGEE
${form.mortgagorName}        ${form.mortgageeName}

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
        <IconSymbol name="building.columns.fill" size={22} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Mortgage Deed</Text>
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
              Draft a mortgage deed document
            </Text>

            {/* Mortgagor */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mortgagor (Borrower)</Text>
              <InputField label="Mortgagor Name *" value={form.mortgagorName}
                onChangeText={(v) => update("mortgagorName", v)} placeholder="Full name of borrower" colors={colors} />
              <InputField label="Mortgagor Address" value={form.mortgagorAddress}
                onChangeText={(v) => update("mortgagorAddress", v)} placeholder="Complete address" multiline colors={colors} />
            </View>

            {/* Mortgagee */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mortgagee (Lender)</Text>
              <InputField label="Mortgagee Name *" value={form.mortgageeName}
                onChangeText={(v) => update("mortgageeName", v)} placeholder="Full name of lender / bank" colors={colors} />
              <InputField label="Mortgagee Address" value={form.mortgageeAddress}
                onChangeText={(v) => update("mortgageeAddress", v)} placeholder="Complete address" multiline colors={colors} />
            </View>

            {/* Loan Details */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Loan Details</Text>
              <InputField label="Loan Amount (₹) *" value={form.loanAmount}
                onChangeText={(v) => update("loanAmount", v)} placeholder="e.g., 5000000" keyboardType="numeric" colors={colors} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <InputField label="Interest Rate (%)" value={form.interestRate}
                    onChangeText={(v) => update("interestRate", v)} placeholder="e.g., 12" keyboardType="numeric" colors={colors} />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <InputField label="Period (months)" value={form.repaymentPeriod}
                    onChangeText={(v) => update("repaymentPeriod", v)} placeholder="e.g., 60" keyboardType="numeric" colors={colors} />
                </View>
              </View>
              <InputField label="Execution Date" value={form.executionDate}
                onChangeText={(v) => update("executionDate", v)} placeholder="DD/MM/YYYY" colors={colors} />
            </View>

            {/* Property */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Property Schedule</Text>
              <InputField label="Property Description" value={form.propertySchedule}
                onChangeText={(v) => update("propertySchedule", v)}
                placeholder="Survey No., area, boundaries, location..." multiline numberOfLines={4} colors={colors} />
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
                  <Text style={styles.generateBtnText}>Generate Mortgage Deed</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.reportHeader, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={[styles.reportHeaderText, { color: colors.success }]}>
                Mortgage Deed Generated Successfully
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
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14, marginTop: 4, marginBottom: 8 },
  generateBtnText: { fontSize: 16, fontWeight: "700", color: "#1A3C8F" },
  reportHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  reportHeaderText: { fontSize: 14, fontWeight: "600" },
  reportText: { fontSize: 12, fontFamily: "monospace", lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
});
