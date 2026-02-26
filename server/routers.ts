import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

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

  // ─── AI Assistant (Gemini proxy) ───────────────────────────────────────────
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

        // Convert Gemini-format history to OpenAI-format messages
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
