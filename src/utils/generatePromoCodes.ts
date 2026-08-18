/**
 * Helper to generate unique subscription promo codes with prefix SATANGOPL-XXXX-YYYY
 */

export function generatePromoCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const genPart = (length: number) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `SATANGOPL-${genPart(4)}-${genPart(4)}`;
}

export function generatePromoCodesBatch(count: number, durationDays: number = 30): {
  codes: string[];
  sqlInsert: string;
} {
  const codes: string[] = [];
  const inserted = new Set<string>();

  while (codes.length < count) {
    const code = generatePromoCode();
    if (!inserted.has(code)) {
      inserted.add(code);
      codes.push(code);
    }
  }

  // Generate SQL insert queries to quickly populate Supabase DB table
  const values = codes.map((c) => `('${c}', ${durationDays})`).join(",\n  ");
  const sqlInsert = `INSERT INTO public.promo_codes (code, duration_days)\nVALUES\n  ${values}\nON CONFLICT (code) DO NOTHING;`;

  return { codes, sqlInsert };
}
