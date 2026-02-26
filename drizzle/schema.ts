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
 * App-level users with email/password login, roles, and approval flow.
 * Separate from the OAuth users table above.
 */
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "member"]).default("member").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;

/**
 * Daily MIS (Management Information System) work reports submitted by team members.
 */
export const dailyMisReports = mysqlTable("daily_mis_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportDate: varchar("reportDate", { length: 20 }).notNull(), // YYYY-MM-DD
  tasksCompleted: text("tasksCompleted").notNull(),
  hoursWorked: varchar("hoursWorked", { length: 10 }).notNull(),
  titleReportsDone: int("titleReportsDone").default(0),
  mortgageDeedsDone: int("mortgageDeedsDone").default(0),
  saleDeedsDone: int("saleDeedsDone").default(0),
  courtVisits: int("courtVisits").default(0),
  clientMeetings: int("clientMeetings").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyMisReport = typeof dailyMisReports.$inferSelect;
export type InsertDailyMisReport = typeof dailyMisReports.$inferInsert;

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
  // New fields
  entryBy: varchar("entryBy", { length: 255 }),
  registrationDoneBy: varchar("registrationDoneBy", { length: 255 }),
  receivedAtOfficeBy: varchar("receivedAtOfficeBy", { length: 255 }),
  onlineCheckedBy: varchar("onlineCheckedBy", { length: 255 }),
  handOverToName: varchar("handOverToName", { length: 255 }),
  handOverToNumber: varchar("handOverToNumber", { length: 20 }),
  advocateFees: varchar("advocateFees", { length: 100 }),
  bankReferenceNumber: varchar("bankReferenceNumber", { length: 100 }),
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
  purchaserMobile: varchar("purchaserMobile", { length: 20 }),
  propertyDetails: text("propertyDetails").notNull(),
  sroOffice: varchar("sroOffice", { length: 255 }),
  saleDeedNumber: varchar("saleDeedNumber", { length: 100 }),
  saleDeedPayment: varchar("saleDeedPayment", { length: 100 }),
  saleDeedPaymentReference: varchar("saleDeedPaymentReference", { length: 255 }),
  saleDeedPaymentScreenshot: text("saleDeedPaymentScreenshot"),
  // New fields
  entryBy: varchar("entryBy", { length: 255 }),
  checkedBy: varchar("checkedBy", { length: 255 }),
  registrationDoneBy: varchar("registrationDoneBy", { length: 255 }),
  advocateFees: varchar("advocateFees", { length: 100 }),
  officeReceivedBy: varchar("officeReceivedBy", { length: 255 }),
  handOverToName: varchar("handOverToName", { length: 255 }),
  handOverToNumber: varchar("handOverToNumber", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SaleDeed = typeof saleDeeds.$inferSelect;
export type InsertSaleDeed = typeof saleDeeds.$inferInsert;

/**
 * Tasks assigned by admin to team members.
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: int("assignedTo").notNull(), // app_users.id
  assignedBy: int("assignedBy").notNull(), // app_users.id (admin)
  dueDate: varchar("dueDate", { length: 20 }), // YYYY-MM-DD
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
