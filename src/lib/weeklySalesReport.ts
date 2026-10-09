import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type Stripe from "stripe";
import { sendWeeklySalesReportEmail } from "./email";
import { getStripe } from "./stripe";

const REPORT_TIME_ZONE = "Europe/Warsaw";
const PRODUCT_ID = "instrumentalne-abc";

type WeekRange = {
  start: Date;
  end: Date;
  label: string;
  marker: string;
};

type SalesTotals = {
  quantity: number;
  gross: number;
  tax: number;
  fees: number;
  refunds: number;
  net: number;
  currency: string;
};

function localParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function timeZoneOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const representedAsUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return representedAsUtc - date.getTime();
}

function localMidnightUtc(year: number, month: number, day: number): Date {
  const initial = Date.UTC(year, month - 1, day);
  let result = initial - timeZoneOffsetMs(new Date(initial));
  result = initial - timeZoneOffsetMs(new Date(result));
  return new Date(result);
}

export function previousWarsawWeek(now = new Date()): WeekRange {
  const today = localParts(now);
  const calendar = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const daysSinceMonday = (calendar.getUTCDay() + 6) % 7;
  const currentMonday = new Date(calendar.getTime() - daysSinceMonday * 86_400_000);
  const previousMonday = new Date(currentMonday.getTime() - 7 * 86_400_000);
  const startParts = {
    year: previousMonday.getUTCFullYear(),
    month: previousMonday.getUTCMonth() + 1,
    day: previousMonday.getUTCDate(),
  };
  const endParts = {
    year: currentMonday.getUTCFullYear(),
    month: currentMonday.getUTCMonth() + 1,
    day: currentMonday.getUTCDate(),
  };
  const start = localMidnightUtc(startParts.year, startParts.month, startParts.day);
  const end = localMidnightUtc(endParts.year, endParts.month, endParts.day);
  const display = new Intl.DateTimeFormat("pl-PL", {
    timeZone: REPORT_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const lastDay = new Date(end.getTime() - 1);
  const marker = `${startParts.year}-${String(startParts.month).padStart(2, "0")}-${String(startParts.day).padStart(2, "0")}`;
  return { start, end, label: `${display.format(start)}–${display.format(lastDay)}`, marker };
}

function isWarsawMondayAtEight(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return weekday === "Mon" && hour === 8;
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function expandedPaymentIntent(session: Stripe.Checkout.Session): Stripe.PaymentIntent | null {
  return session.payment_intent && typeof session.payment_intent !== "string"
    ? session.payment_intent
    : null;
}

async function collectSales(range: WeekRange): Promise<{ totals: SalesTotals; payouts: Stripe.Payout[] }> {
  const stripe = getStripe();
  const totals: SalesTotals = {
    quantity: 0,
    gross: 0,
    tax: 0,
    fees: 0,
    refunds: 0,
    net: 0,
    currency: "pln",
  };

  const sessions = stripe.checkout.sessions.list({
    created: {
      gte: Math.floor(range.start.getTime() / 1000),
      lt: Math.floor(range.end.getTime() / 1000),
    },
    limit: 100,
    expand: ["data.payment_intent.latest_charge.balance_transaction"],
  });

  for await (const session of sessions) {
    if (session.payment_status !== "paid" || session.metadata?.product_id !== PRODUCT_ID) continue;
    const paymentIntent = expandedPaymentIntent(session);
    const charge = paymentIntent?.latest_charge && typeof paymentIntent.latest_charge !== "string"
      ? paymentIntent.latest_charge
      : null;
    const balanceTransaction = charge?.balance_transaction && typeof charge.balance_transaction !== "string"
      ? charge.balance_transaction
      : null;

    totals.quantity += 1;
    totals.gross += session.amount_total || 0;
    totals.tax += session.total_details?.amount_tax || 0;
    totals.fees += balanceTransaction?.fee || 0;
    totals.refunds += charge?.amount_refunded || 0;
    totals.currency = session.currency || totals.currency;
  }
  totals.net = totals.gross - totals.refunds - totals.fees;

  const payouts: Stripe.Payout[] = [];
  for await (const payout of stripe.payouts.list({
    created: {
      gte: Math.floor(range.start.getTime() / 1000),
      lt: Math.floor(range.end.getTime() / 1000),
    },
    limit: 100,
  })) {
    payouts.push(payout);
  }

  return { totals, payouts };
}

function markerPath(marker: string): string {
  return path.join(process.cwd(), ".data", "weekly-reports", `${marker}.json`);
}

async function markerExists(marker: string): Promise<boolean> {
  try {
    await readFile(markerPath(marker), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function sendPreviousWeekSalesReport(input?: {
  force?: boolean;
  now?: Date;
}): Promise<{ ok: boolean; skipped?: boolean; reason?: string; marker: string }> {
  const range = previousWarsawWeek(input?.now);
  if (!input?.force && !isWarsawMondayAtEight(input?.now || new Date())) {
    return { ok: true, skipped: true, reason: "Poza poniedziałkowym oknem 08:00 Europe/Warsaw.", marker: range.marker };
  }
  if (!input?.force && await markerExists(range.marker)) {
    return { ok: true, skipped: true, marker: range.marker };
  }

  const to = (process.env.WEEKLY_REPORT_TO || "G.D.D.biuro@gmail.com").trim();
  const { totals, payouts } = await collectSales(range);
  const payoutRows = payouts.length
    ? payouts.map((payout) => `${money(payout.amount, payout.currency)} — ${payout.status}`).join("\n")
    : "Brak wypłat w tym okresie";
  const subject = `GDD — sprzedaż e-booka ${range.label}`;
  const text = [
    `Podsumowanie sprzedaży za ${range.label}`,
    "",
    `Sprzedane egzemplarze: ${totals.quantity}`,
    `Sprzedaż brutto: ${money(totals.gross, totals.currency)}`,
    `VAT wykazany przez Stripe: ${money(totals.tax, totals.currency)}`,
    `Opłaty Stripe: ${money(totals.fees, totals.currency)}`,
    `Zwroty: ${money(totals.refunds, totals.currency)}`,
    `Sprzedaż po zwrotach i opłatach: ${money(totals.net, totals.currency)}`,
    "",
    "Wypłaty:",
    payoutRows,
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#24262b;line-height:1.55;max-width:640px">
      <h1 style="font-size:22px">Podsumowanie sprzedaży</h1>
      <p>${range.label}</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border-bottom:1px solid #ddd">Sprzedane egzemplarze</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right"><strong>${totals.quantity}</strong></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd">Sprzedaż brutto</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${money(totals.gross, totals.currency)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd">VAT wykazany przez Stripe</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${money(totals.tax, totals.currency)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd">Opłaty Stripe</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${money(totals.fees, totals.currency)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd">Zwroty</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${money(totals.refunds, totals.currency)}</td></tr>
        <tr><td style="padding:8px">Po zwrotach i opłatach</td><td style="padding:8px;text-align:right"><strong>${money(totals.net, totals.currency)}</strong></td></tr>
      </table>
      <h2 style="font-size:17px;margin-top:24px">Wypłaty</h2>
      <pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${payoutRows}</pre>
    </div>`;

  const sent = await sendWeeklySalesReportEmail({ to, subject, text, html });
  if (!sent.ok) return { ok: false, reason: sent.error, marker: range.marker };

  const file = markerPath(range.marker);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ sentAt: new Date().toISOString(), to, range: range.label }), "utf8");
  return { ok: true, marker: range.marker };
}
