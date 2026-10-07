/**
 * 给 records 表补 conversation_id 列。
 * 用法：node scripts/migrate-conversation-id.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import pg from "pg";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("缺少 DATABASE_URL，请在 Supabase SQL 编辑器执行：");
  console.error("ALTER TABLE records ADD COLUMN IF NOT EXISTS conversation_id TEXT DEFAULT '';");
  console.error("NOTIFY pgrst, 'reload schema';");
  process.exit(1);
}

const url = new URL(raw);
url.searchParams.delete("channel_binding");
if (!url.searchParams.get("sslmode")) url.searchParams.set("sslmode", "require");

const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`ALTER TABLE records ADD COLUMN IF NOT EXISTS photo_key TEXT DEFAULT ''`);
await client.query(`ALTER TABLE records ADD COLUMN IF NOT EXISTS conversation_id TEXT DEFAULT ''`);
try {
  await client.query(`NOTIFY pgrst, 'reload schema'`);
} catch {
  // 非 PostgREST 环境可忽略
}
const { rows } = await client.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'records' AND column_name = 'conversation_id'
`);
await client.end();

if (!rows.length) {
  console.error("迁移失败：仍未找到 conversation_id");
  process.exit(1);
}
console.log("OK: records.conversation_id 已就绪");
