import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  titleReports, InsertTitleReport,
  mortgageDeeds, InsertMortgageDeed,
  saleDeeds, InsertSaleDeed,
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
