import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";

/**
 * Export an array of objects to an Excel (.xlsx) file and share it.
 * @param data Array of plain objects (rows)
 * @param sheetName Name of the worksheet
 * @param fileName File name without extension
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string
): Promise<void> {
  try {
    if (data.length === 0) {
      Alert.alert("No Data", "There are no records to export.");
      return;
    }

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate binary string
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    if (Platform.OS === "web") {
      // Web: trigger download
      const blob = new Blob(
        [Uint8Array.from(atob(wbout), (c) => c.charCodeAt(0))],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Native: write to cache directory and share
    const fileUri = `${FileSystem.cacheDirectory}${fileName}.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: `Export ${sheetName}`,
        UTI: "com.microsoft.excel.xlsx",
      });
    } else {
      Alert.alert("Saved", `File saved to: ${fileUri}`);
    }
  } catch (err: any) {
    console.error("Excel export error:", err);
    Alert.alert("Export Failed", err.message || "Could not export file.");
  }
}
