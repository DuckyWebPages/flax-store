import { neon } from "@neondatabase/serverless";

console.log("set-stock starting...");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // 1) Create table (using a template string backtick safely)
  await sql.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      sku TEXT PRIMARY KEY,
      stock INTEGER NOT NULL DEFAULT 0,
      backorder BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 2) Upsert one tracked SKU so we SEE progress
  await sql.query(
    "INSERT INTO inventory (sku, stock, backorder) VALUES ($1,$2,$3) ON CONFLICT (sku) DO UPDATE SET stock=$2, backorder=$3, updated_at=now()",
    ["aftershot", 50, false]
  );

  // 3) Mark FHL as infinite (ignore inventory)
  await sql.query(
    "INSERT INTO inventory (sku, stock, backorder) VALUES ($1,$2,$3) ON CONFLICT (sku) DO UPDATE SET backorder=$3, updated_at=now()",
    ["fhl-single", 0, true]
  );

  const { rows } = await sql.query(
    "SELECT sku, stock, backorder FROM inventory WHERE sku IN ('aftershot','fhl-single') ORDER BY sku"
  );
  console.log("Done. Rows:", rows);
}

main().catch(e => { console.error("Error:", e.message || e); process.exit(1); });
