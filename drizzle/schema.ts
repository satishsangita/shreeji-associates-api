import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Title Report records
 */
export const titleReports = mysqlTable("title_reports", {
  id: int("id").autoincrement().primaryKey(),
  srNo: varchar("srNo", { length: 50 }).notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  partyName: varchar("partyName", { length: 255 }).notNull(),
  loanNumber: varchar("loanNumber", { length: 100 }).notNull(),
  propertyDetails: text("propertyDetails").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TitleReport = typeof titleReports.$inferSelect;
export type InsertTitleReport = typeof titleReports.$inferInsert;

/**
 * Mortgage Deed records
 */
export const mortgageDeeds = mysqlTable("mortgage_deeds", {
  id: int("id").autoincrement().primaryKey(),
  partyName: varchar("partyName", { length: 255 }).notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  loanAmount: varchar("loanAmount", { length: 100 }).notNull(),
  partyMobile: varchar("partyMobile", { length: 20 }).notNull(),
  propertyDetails: text("propertyDetails").notNull(),
  paymentDetails: text("paymentDetails"),
  appointmentDate: varchar("appointmentDate", { length: 50 }),
  mortgageDeedNumber: varchar("mortgageDeedNumber", { length: 100 }),
  subRegistrarOffice: varchar("subRegistrarOffice", { length: 255 }),
  mortgagePaymentScreenshot: text("mortgagePaymentScreenshot"),
  mortgageReference: varchar("mortgageReference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MortgageDeed = typeof mortgageDeeds.$inferSelect;
export type InsertMortgageDeed = typeof mortgageDeeds.$inferInsert;

/**
 * Sale Deed records
 */
export const saleDeeds = mysqlTable("sale_deeds", {
  id: int("id").autoincrement().primaryKey(),
  sellerName: varchar("sellerName", { length: 255 }).notNull(),
  purchaserName: varchar("purchaserName", { length: 255 }).notNull(),
  propertyDetails: text("propertyDetails").notNull(),
  sroOffice: varchar("sroOffice", { length: 255 }),
  saleDeedNumber: varchar("saleDeedNumber", { length: 100 }),
  saleDeedPayment: varchar("saleDeedPayment", { length: 100 }),
  saleDeedPaymentReference: varchar("saleDeedPaymentReference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SaleDeed = typeof saleDeeds.$inferSelect;
export type InsertSaleDeed = typeof saleDeeds.$inferInsert;
