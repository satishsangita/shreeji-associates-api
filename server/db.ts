import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  titleReports, InsertTitleReport,
  mortgageDeeds, InsertMortgageDeed,
  saleDeeds, InsertSaleDeed,
  appUsers, InsertAppUser,
  dailyMisReports, InsertDailyMisReport,
  tasks, InsertTask,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── App Users (email/password auth) ─────────────────────────────────────────

export async function getAppUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(appUsers).where(eq(appUsers.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppUser(data: InsertAppUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appUsers).values(data);
  return result[0].insertId;
}

export async function updateAppUser(id: number, data: Partial<InsertAppUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set(data).where(eq(appUsers.id, id));
}

export async function getPendingAppUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appUsers).where(eq(appUsers.status, "pending")).orderBy(desc(appUsers.createdAt));
}

export async function getAllAppUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: appUsers.id,
    name: appUsers.name,
    email: appUsers.email,
    role: appUsers.role,
    status: appUsers.status,
    createdAt: appUsers.createdAt,
  }).from(appUsers).orderBy(desc(appUsers.createdAt));
}

// ─── Daily MIS Reports ────────────────────────────────────────────────────────

export async function createMisReport(data: InsertDailyMisReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dailyMisReports).values(data);
  return result[0].insertId;
}

export async function updateMisReport(id: number, data: Partial<InsertDailyMisReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyMisReports).set(data).where(eq(dailyMisReports.id, id));
}

export async function deleteMisReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dailyMisReports).where(eq(dailyMisReports.id, id));
}

export async function getMisReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyMisReports)
    .where(eq(dailyMisReports.userId, userId))
    .orderBy(desc(dailyMisReports.reportDate));
}

export async function getAllMisReports() {
  const db = await getDb();
  if (!db) return [];
  // Join with app_users to get user name
  const reports = await db.select({
    id: dailyMisReports.id,
    userId: dailyMisReports.userId,
    reportDate: dailyMisReports.reportDate,
    tasksCompleted: dailyMisReports.tasksCompleted,
    hoursWorked: dailyMisReports.hoursWorked,
    titleReportsDone: dailyMisReports.titleReportsDone,
    mortgageDeedsDone: dailyMisReports.mortgageDeedsDone,
    saleDeedsDone: dailyMisReports.saleDeedsDone,
    courtVisits: dailyMisReports.courtVisits,
    clientMeetings: dailyMisReports.clientMeetings,
    notes: dailyMisReports.notes,
    createdAt: dailyMisReports.createdAt,
    userName: appUsers.name,
    userEmail: appUsers.email,
  }).from(dailyMisReports)
    .leftJoin(appUsers, eq(dailyMisReports.userId, appUsers.id))
    .orderBy(desc(dailyMisReports.reportDate));
  return reports;
}

export async function getMisReportByUserAndDate(userId: number, reportDate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyMisReports)
    .where(and(eq(dailyMisReports.userId, userId), eq(dailyMisReports.reportDate, reportDate)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Title Reports ───────────────────────────────────────────────────────────

export async function getAllTitleReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(titleReports).orderBy(desc(titleReports.createdAt));
}

export async function createTitleReport(data: InsertTitleReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(titleReports).values(data);
  return result[0].insertId;
}

export async function updateTitleReport(id: number, data: Partial<InsertTitleReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(titleReports).set(data).where(eq(titleReports.id, id));
}

export async function deleteTitleReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(titleReports).where(eq(titleReports.id, id));
}

// ─── Mortgage Deeds ──────────────────────────────────────────────────────────

export async function getAllMortgageDeeds() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mortgageDeeds).orderBy(desc(mortgageDeeds.createdAt));
}

export async function createMortgageDeed(data: InsertMortgageDeed) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mortgageDeeds).values(data);
  return result[0].insertId;
}

export async function updateMortgageDeed(id: number, data: Partial<InsertMortgageDeed>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(mortgageDeeds).set(data).where(eq(mortgageDeeds.id, id));
}

export async function deleteMortgageDeed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(mortgageDeeds).where(eq(mortgageDeeds.id, id));
}

// ─── Sale Deeds ──────────────────────────────────────────────────────────────

export async function getAllSaleDeeds() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(saleDeeds).orderBy(desc(saleDeeds.createdAt));
}

export async function createSaleDeed(data: InsertSaleDeed) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(saleDeeds).values(data);
  return result[0].insertId;
}

export async function updateSaleDeed(id: number, data: Partial<InsertSaleDeed>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(saleDeeds).set(data).where(eq(saleDeeds.id, id));
}

export async function deleteSaleDeed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(saleDeeds).where(eq(saleDeeds.id, id));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTasksForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.assignedTo, userId)).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Auto MIS: count deeds created by a user on a specific date ───────────────

export async function getMisSummaryForUser(userId: number, reportDate: string) {
  // reportDate: YYYY-MM-DD
  const db = await getDb();
  if (!db) return { titleReports: 0, mortgageDeeds: 0, saleDeeds: 0 };
  // We count records created on the given date
  // Since we don't have a createdBy field on deeds, we return 0 for auto-count
  // The MIS report auto-generation will query total counts from the DB for the day
  const startOfDay = new Date(reportDate + "T00:00:00.000Z");
  const endOfDay = new Date(reportDate + "T23:59:59.999Z");
  const [trCount] = await db.select({ count: sql`COUNT(*)` }).from(titleReports)
    .where(and(gte(titleReports.createdAt, startOfDay), lte(titleReports.createdAt, endOfDay)));
  const [mdCount] = await db.select({ count: sql`COUNT(*)` }).from(mortgageDeeds)
    .where(and(gte(mortgageDeeds.createdAt, startOfDay), lte(mortgageDeeds.createdAt, endOfDay)));
  const [sdCount] = await db.select({ count: sql`COUNT(*)` }).from(saleDeeds)
    .where(and(gte(saleDeeds.createdAt, startOfDay), lte(saleDeeds.createdAt, endOfDay)));
  return {
    titleReports: Number((trCount as any)?.count ?? 0),
    mortgageDeeds: Number((mdCount as any)?.count ?? 0),
    saleDeeds: Number((sdCount as any)?.count ?? 0),
  };
}
