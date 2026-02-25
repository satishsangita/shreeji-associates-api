import { describe, it, expect } from "vitest";

// Test the document generation logic (pure functions extracted for testing)

function generateTitleReport(form: {
  ownerName: string;
  propertyAddress: string;
  surveyNumber?: string;
  district: string;
  taluka?: string;
  description?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const today = new Date().toLocaleDateString("en-IN");
  return `TITLE SEARCH REPORT
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
}

function generateSaleDeed(form: {
  sellerName: string;
  sellerAddress?: string;
  buyerName: string;
  buyerAddress?: string;
  propertyAddress: string;
  saleAmount: string;
  advanceAmount?: string;
  executionDate?: string;
}) {
  const today = form.executionDate || new Date().toLocaleDateString("en-IN");
  const balanceAmount =
    form.saleAmount && form.advanceAmount
      ? `₹ ${(parseFloat(form.saleAmount) - parseFloat(form.advanceAmount)).toLocaleString("en-IN")}`
      : "As agreed";
  return `SALE DEED
═══════════════════════════════════════

This Sale Deed is executed on ${today}

BETWEEN

THE VENDOR (SELLER):
Name    : ${form.sellerName}
Address : ${form.sellerAddress || "As per records"}

AND

THE PURCHASER (BUYER):
Name    : ${form.buyerName}
Address : ${form.buyerAddress || "As per records"}

SCHEDULE OF PROPERTY
───────────────────────────────────────
${form.propertyAddress}

CONSIDERATION
───────────────────────────────────────
Total Sale Amount  : ₹ ${form.saleAmount}
Advance Paid       : ₹ ${form.advanceAmount || "0"}
Balance Payable    : ${balanceAmount}
`;
}

describe("Document Generation", () => {
  describe("Title Report", () => {
    it("generates a title report with required fields", () => {
      const report = generateTitleReport({
        ownerName: "Ramesh Patel",
        propertyAddress: "Plot 45, Satellite Road, Ahmedabad",
        district: "Ahmedabad",
      });
      expect(report).toContain("TITLE SEARCH REPORT");
      expect(report).toContain("Ramesh Patel");
      expect(report).toContain("Plot 45, Satellite Road, Ahmedabad");
      expect(report).toContain("Ahmedabad");
      expect(report).toContain("Shreeji Associates");
    });

    it("includes survey number when provided", () => {
      const report = generateTitleReport({
        ownerName: "Suresh Shah",
        propertyAddress: "Survey 123/A",
        district: "Surat",
        surveyNumber: "123/A",
      });
      expect(report).toContain("Survey Number    : 123/A");
    });

    it("shows N/A for missing optional fields", () => {
      const report = generateTitleReport({
        ownerName: "Test Owner",
        propertyAddress: "Test Address",
        district: "Test District",
      });
      expect(report).toContain("Survey Number    : N/A");
      expect(report).toContain("Taluka           : N/A");
    });
  });

  describe("Sale Deed", () => {
    it("generates a sale deed with required fields", () => {
      const deed = generateSaleDeed({
        sellerName: "Vendor A",
        buyerName: "Purchaser B",
        propertyAddress: "Plot 10, Navrangpura",
        saleAmount: "2500000",
      });
      expect(deed).toContain("SALE DEED");
      expect(deed).toContain("Vendor A");
      expect(deed).toContain("Purchaser B");
      expect(deed).toContain("Plot 10, Navrangpura");
      expect(deed).toContain("₹ 2500000");
    });

    it("calculates balance amount correctly", () => {
      const deed = generateSaleDeed({
        sellerName: "Seller",
        buyerName: "Buyer",
        propertyAddress: "Property",
        saleAmount: "1000000",
        advanceAmount: "200000",
      });
      expect(deed).toContain("₹ 200000");
      // Balance = 1000000 - 200000 = 800000 (Indian locale: 8,00,000)
      expect(deed).toContain("8,00,000");
    });

    it("shows As agreed when no advance amount", () => {
      const deed = generateSaleDeed({
        sellerName: "Seller",
        buyerName: "Buyer",
        propertyAddress: "Property",
        saleAmount: "500000",
      });
      expect(deed).toContain("Balance Payable    : As agreed");
    });
  });
});
