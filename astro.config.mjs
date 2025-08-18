import vercel from "@astrojs/vercel";
export default defineConfig({
  output: "server",
  adapter: vercel({ runtime: "nodejs18.x" }), // or simply vercel()
});

