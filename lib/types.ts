// Shared types for Shreeji Associates

export interface HearingEntry {
  id: string;
  date: string;
  caseTitle: string;
  caseNumber: string;
  purpose: string;
  court: string;
}

export interface TitleReportForm {
  propertyAddress: string;
  surveyNumber: string;
  ownerName: string;
  district: string;
  taluka: string;
  description: string;
  fromDate: string;
  toDate: string;
}

export interface MortgageDeedForm {
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

export interface SaleDeedForm {
  sellerName: string;
  sellerAddress: string;
  buyerName: string;
  buyerAddress: string;
  propertyAddress: string;
  saleAmount: string;
  advanceAmount: string;
  executionDate: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
