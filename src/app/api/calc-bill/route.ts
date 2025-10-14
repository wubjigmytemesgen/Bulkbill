import { NextResponse } from 'next/server';
import * as z from 'zod';
import { calculateBill, customerTypes, sewerageConnections, safeParseJsonField } from '@/lib/billing';
import { dbGetTariffByTypeAndYear } from '@/lib/db-queries';

const CalcBillSchema = z.object({
  usageM3: z.number().nonnegative(),
  customerType: z.enum(customerTypes as unknown as [string, ...string[]]),
  sewerageConnection: z.enum(sewerageConnections as unknown as [string, ...string[]]),
  meterSize: z.number().nonnegative(),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CalcBillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
    }

    const { usageM3, customerType, sewerageConnection, meterSize, billingMonth } = parsed.data;
    const result = await calculateBill(usageM3, customerType as any, sewerageConnection as any, meterSize, billingMonth);
    // Also fetch raw tariff row for diagnostics
    const year = parseInt(billingMonth.split('-')[0], 10);
    const rawTariffRow = await dbGetTariffByTypeAndYear(customerType as string, year);
    const meterRentPricesRaw = safeParseJsonField<any>(rawTariffRow?.meter_rent_prices, 'meter_rent_prices', 'object');

    // attempt to find matched key used by billing (best-effort)
    const keys = Object.keys(meterRentPricesRaw || {});
    const parseNumericKey = (k: string) => {
      if (!k) return NaN;
      const cleaned = k.replace(/[^0-9.\/-]/g, '').trim();
      if (/^\d+\/\d+$/.test(cleaned)) { const [a,b]=cleaned.split('/').map(Number); if (b) return a/b; }
      const n = Number(cleaned); return Number.isFinite(n) ? n : NaN;
    };
    let matchedKey: string | null = null;
    let matchedValue: number | null = null;
    if (meterRentPricesRaw) {
      // exact
      if (meterRentPricesRaw[String(meterSize)] !== undefined) {
        matchedKey = String(meterSize);
        matchedValue = Number(meterRentPricesRaw[matchedKey]) || null;
      } else {
        const target = Number(meterSize);
        for (const k of keys) {
          const num = parseNumericKey(k);
          if (!Number.isNaN(num) && Math.abs(num - target) < 1e-6) {
            matchedKey = k; matchedValue = Number(meterRentPricesRaw[k]) || null; break;
          }
        }
      }
    }

    return NextResponse.json({ success: true, bill: result, diagnostic: { year, rawTariffRow: !!rawTariffRow, meterRentPrices: meterRentPricesRaw, matchedKey, matchedValue } });
  } catch (e: any) {
    console.error('calc-bill error:', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
