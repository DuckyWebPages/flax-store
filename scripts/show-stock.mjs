import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL"); process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const res = await sql.query(
    "SELECT sku, stock, backorder, updated_at FROM inventory ORDER BY sku"
  );
  console.log(JSON.stringify(res.rows, null, 2));
}
main().catch(e => { console.error("DB error:", e.message || e); process.exit(1); });
