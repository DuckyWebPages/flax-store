// FILE: src/lib/db.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

/** Read current stocks for multiple SKUs */
export async function getStocks(skus: string[]): Promise<Record<string, number>> {
  if (!skus.length) return {};
  // Use conventional query with placeholders; $1 is a text[] array
  const { rows } = await sql.query<{ sku: string; stock: number }>(
    "SELECT sku, stock FROM inventory WHERE sku = ANY($1::text[])",
    [skus]
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.sku] = r.stock;
  return out;
}

/** Throw if any requested qty exceeds stock */
export async function assertInStock(cart: { sku: string; qty: number }[]) {
  const skus = cart.map(i => i.sku);
  const stocks = await getStocks(skus);
  const insuff: { sku: string; have: number; want: number }[] = [];
  for (const { sku, qty } of cart) {
    const have = stocks[sku] ?? 0;
    if (qty > have) insuff.push({ sku, have, want: qty });
  }
  if (insuff.length) {
    const err: any = new Error("OUT_OF_STOCK");
    err.code = "OUT_OF_STOCK";
    err.details = insuff;
    throw err;
  }
}

/** Atomically decrement stock after successful payment */
export async function decrementStock(items: { sku: string; qty: number }[]) {
  for (const { sku, qty } of items) {
    const { rows } = await sql.query<{ stock: number }>(
      "UPDATE inventory SET stock = stock - $1, updated_at = now() WHERE sku = $2 AND stock >= $1 RETURNING stock",
      [qty, sku]
    );
    if (rows.length === 0) {
      throw new Error(`Insufficient stock to decrement for ${sku} (qty ${qty})`);
    }
  }
}
