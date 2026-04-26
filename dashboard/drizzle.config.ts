import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local for the CLI (Next.js auto-loads it at runtime, but
// `bunx drizzle-kit` does not), then fall back to .env. Without this,
// migrate / push / studio error out with `url: ''`.
config({ path: ".env.local" });
config({ path: ".env" });

// `generate` works offline and does not need DATABASE_URL.
// `push` / `migrate` / `studio` require it — drizzle-kit will error out
// at command time if missing, which is the desired UX.
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
