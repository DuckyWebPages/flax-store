import { config } from 'dotenv';
config({ path: '.env.local' });

const domain = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const token =
  process.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN ||
  process.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

if (!domain || !token) {
  console.error("Missing env: PUBLIC_SHOPIFY_STORE_DOMAIN or STOREFRONT token");
  console.error("Got keys:", Object.keys(process.env).filter(k => k.includes('SHOPIFY')));
  process.exit(1);
}

const url = `https://${domain}/api/2024-07/graphql.json`;
const query = `{ shop { name } }`;

(async () => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Storefront-Access-Token": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
    process.exit(1);
  }
})();
