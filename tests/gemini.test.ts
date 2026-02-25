import { describe, it, expect } from "vitest";

describe("Gemini API Key Validation", () => {
  it("should successfully call Gemini API with the provided key", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in one word." }] }],
        }),
      }
    );

    // 200 = success, 429 = rate limited (key is valid but quota exhausted temporarily)
    expect([200, 429]).toContain(response.status);
    const data = await response.json();
    if (response.status === 200) {
      expect(data.candidates).toBeDefined();
      expect(data.candidates.length).toBeGreaterThan(0);
    } else {
      // 429 means key is valid but rate limited — acceptable
      expect(data.error.code).toBe(429);
    }
  }, 15000);
});
