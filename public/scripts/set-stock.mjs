// FILE: scripts/set-stock.mjs
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// TODO: edit these counts to your real numbers
const STOCK = {
  // We’ll treat FHL as “infinite” via backorder=true below (so no count here)
  "ancient-single":         40,
  "ocean-cleanse-single":   25,
  "essiac-tea":             18,
  "ningxia-nitro":           0,
  "aftershot":              50,
  "aftershot-3pak":         20,
};

async function main() {
  // Ensure table exists
  await sql.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      sku TEXT PRIMARY KEY,
      stock INTEGER NOT NULL DEFAULT 0,
      backorder BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Upsert exact counts for tracked SKUs
  const entries = Object.entries(STOCK);
  if (entries.length) {
    const placeholders = entries.map((_, i) => `($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(", ");
    const flat = entries.flatMap(([sku, qty]) => [sku, qty, false]); // backorder=false
    const UPSERT = `
      INSERT INTO inventory (sku, stock, backorder)
      VALUES ${placeholders}
      ON CONFLICT (sku) DO UPDATE
      SET stock = EXCLUDED.stock,
          backorder = EXCLUDED.backorder,
          updated_at = now();
    `;
    await sql.query(UPSERT, flat);
  }

  // Mark “infinite” item(s) — ignored by checks & not decremented
  await sql.query(
    "INSERT INTO inventory (sku, stock, backorder) VALUES ($1, $2, $3) ON CONFLICT (sku) DO UPDATE SET backorder=$3, updated_at=now()",
    ["fhl-single", 0, true] // stock ignored when backorder=true
  );

  console.log("Stock set ✅");
}

main().catch(e => {
  console.error("Error setting stock:", e);
  process.exit(1);
});
