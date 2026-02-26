import { z } from "zod";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

const ADMIN_EMAIL = "patel8388@gmail.com";

// Simple JWT-like token using base64 (no external dep needed)
function createAppToken(userId: number, email: string): string {
  const payload = JSON.stringify({ userId, email, iat: Date.now() });
  return Buffer.from(payload).toString("base64url");
}

function parseAppToken(token: string): { userId: number; email: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.userId || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── App Auth (email/password) ─────────────────────────────────────────────
  appAuth: router({
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6).max(100),
      }))
      .mutation(async ({ input }) => {
        const email = input.email.toLowerCase().trim();
        // Check if already exists
        const existing = await db.getAppUserByEmail(email);
        if (existing) throw new Error("An account with this email already exists.");

        const passwordHash = await bcrypt.hash(input.password, 10);
        const isAdmin = email === ADMIN_EMAIL;

        const id = await db.createAppUser({
          name: input.name.trim(),
          email,
          passwordHash,
          role: isAdmin ? "admin" : "member",
          status: isAdmin ? "approved" : "pending",
        });

        const user = await db.getAppUserById(id as number);
        if (!user) throw new Error("Failed to create account.");

        // Notify admin when a new member registers (non-admin only)
        if (!isAdmin) {
          notifyOwner({
            title: "New Team Member Registration",
            content: `${input.name.trim()} (${email}) has registered and is waiting for your approval in the Shreeji Associates app. Open the Admin Panel to approve or reject their request.`,
          }).catch(() => {}); // fire-and-forget, don't block registration
        }

        const token = createAppToken(user.id, user.email);
        return {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
        };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const email = input.email.toLowerCase().trim();
        const user = await db.getAppUserByEmail(email);
        if (!user) throw new Error("Invalid email or password.");

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new Error("Invalid email or password.");

        const token = createAppToken(user.id, user.email);
        return {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
        };
      }),

    getProfile: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Invalid or expired session.");
        const user = await db.getAppUserById(parsed.userId);
        if (!user) throw new Error("User not found.");
        return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
      }),

    // Admin resets a member's password
    resetMemberPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        userId: z.number(),
        newPassword: z.string().min(6).max(100),
      }))
      .mutation(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const admin = await db.getAppUserById(parsed.userId);
        if (!admin || admin.role !== "admin") throw new Error("Admin access required.");
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateAppUser(input.userId, { passwordHash });
        return { success: true };
      }),

    // User updates their own name
    updateName: publicProcedure
      .input(z.object({
        token: z.string(),
        name: z.string().min(2).max(100),
      }))
      .mutation(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const user = await db.getAppUserById(parsed.userId);
        if (!user) throw new Error("User not found.");
        await db.updateAppUser(user.id, { name: input.name.trim() });
        return { success: true, name: input.name.trim() };
      }),

    // User changes their own password
    changePassword: publicProcedure
      .input(z.object({
        token: z.string(),
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(100),
      }))
      .mutation(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const user = await db.getAppUserById(parsed.userId);
        if (!user) throw new Error("User not found.");
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new Error("Current password is incorrect.");
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateAppUser(user.id, { passwordHash });
        return { success: true };
      }),
  }),

  // ─── Team Management (admin only) ─────────────────────────────────────────
  team: router({
    pendingApprovals: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const admin = await db.getAppUserById(parsed.userId);
        if (!admin || admin.role !== "admin") throw new Error("Admin access required.");
        return db.getPendingAppUsers();
      }),

    allMembers: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const admin = await db.getAppUserById(parsed.userId);
        if (!admin || admin.role !== "admin") throw new Error("Admin access required.");
        return db.getAllAppUsers();
      }),

    approveUser: publicProcedure
      .input(z.object({ token: z.string(), userId: z.number(), action: z.enum(["approve", "reject"]) }))
      .mutation(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const admin = await db.getAppUserById(parsed.userId);
        if (!admin || admin.role !== "admin") throw new Error("Admin access required.");

        await db.updateAppUser(input.userId, {
          status: input.action === "approve" ? "approved" : "rejected",
          approvedBy: admin.id,
          approvedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ─── Daily MIS Reports ─────────────────────────────────────────────────────
  mis: router({
    submit: publicProcedure
      .input(z.object({
        token: z.string(),
        reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        tasksCompleted: z.string().min(1),
        hoursWorked: z.string().min(1),
        titleReportsDone: z.number().int().min(0).default(0),
        mortgageDeedsDone: z.number().int().min(0).default(0),
        saleDeedsDone: z.number().int().min(0).default(0),
        courtVisits: z.number().int().min(0).default(0),
        clientMeetings: z.number().int().min(0).default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Please login to submit a report.");
        const user = await db.getAppUserById(parsed.userId);
        if (!user) throw new Error("User not found.");
        if (user.status !== "approved") throw new Error("Your account is pending admin approval.");

        const { token, ...reportData } = input;
        // Check if report for this date already exists
        const existing = await db.getMisReportByUserAndDate(parsed.userId, input.reportDate);
        if (existing) {
          await db.updateMisReport(existing.id, reportData);
          return { id: existing.id, updated: true };
        }
        const id = await db.createMisReport({ ...reportData, userId: parsed.userId });
        return { id, updated: false };
      }),

    myReports: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        return db.getMisReportsByUser(parsed.userId);
      }),

    allReports: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        const admin = await db.getAppUserById(parsed.userId);
        if (!admin || admin.role !== "admin") throw new Error("Admin access required.");
        return db.getAllMisReports();
      }),

    delete: publicProcedure
      .input(z.object({ token: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        const parsed = parseAppToken(input.token);
        if (!parsed) throw new Error("Unauthorized.");
        await db.deleteMisReport(input.id);
        return { success: true };
      }),
  }),

  // ─── Image Upload ──────────────────────────────────────────────────────────
  upload: router({
    image: publicProcedure
      .input(z.object({
        base64: z.string().min(1),
        mimeType: z.string().default("image/jpeg"),
        folder: z.string().default("screenshots"),
      }))
      .mutation(async ({ input }) => {
        const suffix = Math.random().toString(36).slice(2, 8);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const key = `${input.folder}/${Date.now()}-${suffix}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Title Reports ─────────────────────────────────────────────────────────
  titleReports: router({
    list: publicProcedure.query(() => db.getAllTitleReports()),

    create: publicProcedure
      .input(z.object({
        srNo: z.string().min(1),
        bankName: z.string().min(1),
        partyName: z.string().min(1),
        loanNumber: z.string().min(1),
        propertyDetails: z.string().min(1),
      }))
      .mutation(({ input }) => db.createTitleReport(input)),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        srNo: z.string().min(1).optional(),
        bankName: z.string().min(1).optional(),
        partyName: z.string().min(1).optional(),
        loanNumber: z.string().min(1).optional(),
        propertyDetails: z.string().min(1).optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateTitleReport(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteTitleReport(input.id)),
  }),

  // ─── Mortgage Deeds ────────────────────────────────────────────────────────
  mortgageDeeds: router({
    list: publicProcedure.query(() => db.getAllMortgageDeeds()),

    create: publicProcedure
      .input(z.object({
        partyName: z.string().min(1),
        bankName: z.string().min(1),
        loanAmount: z.string().min(1),
        partyMobile: z.string().min(1),
        propertyDetails: z.string().min(1),
        paymentDetails: z.string().optional(),
        appointmentDate: z.string().optional(),
        mortgageDeedNumber: z.string().optional(),
        subRegistrarOffice: z.string().optional(),
        mortgagePaymentScreenshot: z.string().optional(),
        mortgageReference: z.string().optional(),
      }))
      .mutation(({ input }) => db.createMortgageDeed(input)),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        partyName: z.string().min(1).optional(),
        bankName: z.string().min(1).optional(),
        loanAmount: z.string().min(1).optional(),
        partyMobile: z.string().min(1).optional(),
        propertyDetails: z.string().min(1).optional(),
        paymentDetails: z.string().optional(),
        appointmentDate: z.string().optional(),
        mortgageDeedNumber: z.string().optional(),
        subRegistrarOffice: z.string().optional(),
        mortgagePaymentScreenshot: z.string().optional(),
        mortgageReference: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateMortgageDeed(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMortgageDeed(input.id)),
  }),

  // ─── Sale Deeds ────────────────────────────────────────────────────────────
  saleDeeds: router({
    list: publicProcedure.query(() => db.getAllSaleDeeds()),

    create: publicProcedure
      .input(z.object({
        sellerName: z.string().min(1),
        purchaserName: z.string().min(1),
        propertyDetails: z.string().min(1),
        sroOffice: z.string().optional(),
        saleDeedNumber: z.string().optional(),
        saleDeedPayment: z.string().optional(),
        saleDeedPaymentReference: z.string().optional(),
        saleDeedPaymentScreenshot: z.string().optional(),
      }))
      .mutation(({ input }) => db.createSaleDeed(input)),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        sellerName: z.string().min(1).optional(),
        purchaserName: z.string().min(1).optional(),
        propertyDetails: z.string().min(1).optional(),
        sroOffice: z.string().optional(),
        saleDeedNumber: z.string().optional(),
        saleDeedPayment: z.string().optional(),
        saleDeedPaymentReference: z.string().optional(),
        saleDeedPaymentScreenshot: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateSaleDeed(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSaleDeed(input.id)),
  }),

  // ─── AI Assistant ──────────────────────────────────────────────────────────
  ai: router({
    chat: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        history: z.array(z.object({
          role: z.enum(["user", "model"]),
          parts: z.array(z.object({ text: z.string() })),
        })).optional().default([]),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `You are an expert AI Legal Assistant specializing in Indian Law. You are knowledgeable about:
- Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
- Indian Penal Code (IPC) 1860, Code of Criminal Procedure (CrPC) 1973
- Transfer of Property Act 1882, Registration Act 1908, Indian Contract Act 1872
- Negotiable Instruments Act (NI Act) - especially Section 138
- Civil Procedure Code (CPC) 1908, Indian Evidence Act 1872
- Property law, sale deeds, mortgage deeds, title reports
- Gujarat and Indian High Court judgments, Supreme Court of India case laws
Always respond professionally. Cite relevant sections and case laws when applicable. Keep responses focused and practical for an advocate's daily practice.`;

        const historyMessages = input.history.map((h) => ({
          role: h.role === "model" ? ("assistant" as const) : ("user" as const),
          content: h.parts.map((p) => p.text).join(""),
        }));

        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: input.message },
          ],
          maxTokens: 1024,
        });

        const text = result.choices[0]?.message?.content;
        if (!text || typeof text !== "string") throw new Error("No response from AI. Please try again.");
        return { text, model: result.model };
      }),
  }),
});

export type AppRouter = typeof appRouter;
