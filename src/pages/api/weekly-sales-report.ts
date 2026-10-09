import type { APIRoute } from "astro";
import { sendPreviousWeekSalesReport } from "../../lib/weeklySalesReport";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const expected = process.env.WEEKLY_REPORT_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Brak dostępu." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await sendPreviousWeekSalesReport();
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[weekly-report:error]", error);
    return new Response(JSON.stringify({ error: "Nie udało się wygenerować raportu." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
