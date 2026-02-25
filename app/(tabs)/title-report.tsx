import { useState } from "react";
import {
  ScrollView, Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface TitleReportForm {
  propertyAddress: string;
  surveyNumber: string;
  ownerName: string;
  district: string;
  taluka: string;
  description: string;
  fromDate: string;
  toDate: string;
}

const EMPTY_FORM: TitleReportForm = {
  propertyAddress: "",
  surveyNumber: "",
  ownerName: "",
  district: "",
  taluka: "",
  description: "",
  fromDate: "",
  toDate: "",
};

export default function TitleReportScreen() {
  const colors = useColors();
  const [form, setForm] = useState<TitleReportForm>(EMPTY_FORM);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof TitleReportForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    if (!form.propertyAddress || !form.ownerName || !form.district) {
      Alert.alert("Missing Fields", "Please fill in Property Address, Owner Name, and District.");
      return;
    }
    setLoading(true);
    // Simulate generation
    await new Promise((r) => setTimeout(r, 1200));
    const today = new Date().toLocaleDateString("en-IN");
    const report = `TITLE SEARCH REPORT
═══════════════════════════════════════

Prepared by: Shreeji Associates
Date: ${today}

PROPERTY DETAILS
───────────────────────────────────────
Owner Name       : ${form.ownerName}
Property Address : ${form.propertyAddress}
Survey Number    : ${form.surveyNumber || "N/A"}
District         : ${form.district}
Taluka           : ${form.taluka || "N/A"}

SEARCH PERIOD
───────────────────────────────────────
From : ${form.fromDate || "Not specified"}
To   : ${today}

PROPERTY DESCRIPTION
───────────────────────────────────────
${form.description || "As described in the property documents."}

TITLE SEARCH FINDINGS
───────────────────────────────────────
1. The property is registered in the name of ${form.ownerName}.
2. No encumbrances or liens found during the search period.
3. Property tax records are up to date.
4. No pending litigation found against this property.
5. Title appears clear and marketable.

CONCLUSION
───────────────────────────────────────
Based on the documents examined, the title to the above-described property appears to be clear, free, and marketable. This report is prepared for informational purposes only.

Advocate Satish Patel
Shreeji Associates
`;
    setGenerated(report);
    setLoading(false);
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setGenerated(null);
  };

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <IconSymbol name="doc.text.fill" size={22} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Title Report</Text>
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
              Generate a property title search report
            </Text>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Property Information</Text>

              <InputField
                label="Owner Name *"
                value={form.ownerName}
                onChangeText={(v) => update("ownerName", v)}
                placeholder="e.g., Ramesh Patel"
                colors={colors}
              />
              <InputField
                label="Property Address *"
                value={form.propertyAddress}
                onChangeText={(v) => update("propertyAddress", v)}
                placeholder="e.g., Plot 45, Satellite Road, Ahmedabad"
                multiline
                colors={colors}
              />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Survey Number"
                    value={form.surveyNumber}
                    onChangeText={(v) => update("surveyNumber", v)}
                    placeholder="e.g., 123/A"
                    colors={colors}
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <InputField
                    label="District *"
                    value={form.district}
                    onChangeText={(v) => update("district", v)}
                    placeholder="e.g., Ahmedabad"
                    colors={colors}
                  />
                </View>
              </View>
              <InputField
                label="Taluka"
                value={form.taluka}
                onChangeText={(v) => update("taluka", v)}
                placeholder="e.g., Daskroi"
                colors={colors}
              />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Search Period</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="From Date"
                    value={form.fromDate}
                    onChangeText={(v) => update("fromDate", v)}
                    placeholder="DD/MM/YYYY"
                    colors={colors}
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <InputField
                    label="To Date"
                    value={form.toDate}
                    onChangeText={(v) => update("toDate", v)}
                    placeholder="DD/MM/YYYY"
                    colors={colors}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Property Description</Text>
              <InputField
                label="Description (Optional)"
                value={form.description}
                onChangeText={(v) => update("description", v)}
                placeholder="Describe the property boundaries, area, etc."
                multiline
                numberOfLines={4}
                colors={colors}
              />
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
                  <Text style={styles.generateBtnText}>Generate Title Report</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.reportHeader, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={[styles.reportHeaderText, { color: colors.success }]}>
                Title Report Generated Successfully
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={[styles.reportText, { color: colors.foreground }]}>{generated}</Text>
              </ScrollView>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => Alert.alert("Print", "Printing functionality coming soon.")}
                activeOpacity={0.85}
              >
                <IconSymbol name="printer.fill" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => Alert.alert("Share", "Sharing functionality coming soon.")}
                activeOpacity={0.85}
              >
                <IconSymbol name="square.and.arrow.up" size={16} color="#1A3C8F" />
                <Text style={[styles.actionBtnText, { color: "#1A3C8F" }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.border }]}
                onPress={handleClear}
                activeOpacity={0.85}
              >
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
  label, value, onChangeText, placeholder, multiline, numberOfLines, colors,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; numberOfLines?: number; colors: any;
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  scrollContent: { padding: 16, paddingTop: 18 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 5, letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  row: { flexDirection: "row" },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  generateBtnText: { fontSize: 16, fontWeight: "700", color: "#1A3C8F" },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  reportHeaderText: { fontSize: 14, fontWeight: "600" },
  reportText: { fontSize: 12, fontFamily: "monospace", lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
});
