import { describe, it, expect } from "vitest";

describe("Supabase credentials", () => {
  it("should connect to Supabase and return a valid response", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    expect(url).toBeTruthy();
    expect(key).toBeTruthy();
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);

    // Test the REST API health endpoint
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key}`,
      },
    });

    // 200 = connected, 404 = no tables yet (still valid connection)
    expect([200, 404]).toContain(response.status);
    console.log("Supabase connection status:", response.status);
  });
});
