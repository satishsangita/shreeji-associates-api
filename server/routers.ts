import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
      }))
      .mutation(({ input }) => db.createSaleDeed(input)),

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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key not configured on server.");

        const systemPrompt = `You are an expert AI Legal Assistant specializing in Indian Law. You are knowledgeable about:
- Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
- Indian Penal Code (IPC) 1860, Code of Criminal Procedure (CrPC) 1973
- Transfer of Property Act 1882, Registration Act 1908, Indian Contract Act 1872
- Negotiable Instruments Act (NI Act) - especially Section 138
- Civil Procedure Code (CPC) 1908, Indian Evidence Act 1872
- Property law, sale deeds, mortgage deeds, title reports
- Gujarat and Indian High Court judgments, Supreme Court of India case laws
Always respond professionally. Cite relevant sections and case laws when applicable. Keep responses focused and practical for an advocate's daily practice.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [
                ...input.history,
                { role: "user", parts: [{ text: input.message }] },
              ],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
          }
        );

        const data = await response.json() as any;

        if (!response.ok) {
          if (response.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
          throw new Error(data.error?.message || "Gemini API error.");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No response from AI. Please try again.");
        return { text };
      }),
  }),
});

export type AppRouter = typeof appRouter;
