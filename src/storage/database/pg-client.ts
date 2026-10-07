import { Pool, type PoolClient, type QueryResult } from "pg";

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

type Filter = { column: string; op: "=" | "ilike"; value: unknown };
type OrderBy = { column: string; ascending: boolean };
type Embed = { alias: string; table: string; columns: string[] };
type SelectOpts = { count?: "exact"; head?: boolean };

export interface PgQueryResult<T = unknown> {
  data: T;
  error: { message: string } | null;
  count: number | null;
}

function quoteIdent(name: string) {
  if (!IDENT.test(name)) throw new Error(`非法字段: ${name}`);
  return `"${name}"`;
}

function parseSelect(raw: string): { columns: string[]; embeds: Embed[] } {
  const embeds: Embed[] = [];
  const columns: string[] = [];
  const re = /([a-zA-Z_*][a-zA-Z0-9_]*)(?:\(([^)]+)\))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const name = match[1];
    const inner = match[2];
    if (inner) {
      embeds.push({
        alias: name,
        table: name,
        columns: inner.split(",").map((s) => s.trim()).filter(Boolean),
      });
    } else {
      columns.push(name);
    }
  }
  return { columns: columns.length ? columns : ["*"], embeds };
}

function getConnectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  if (!url.searchParams.get("sslmode")) url.searchParams.set("sslmode", "require");
  return url.toString();
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getConnectionString(),
      ssl: { rejectUnauthorized: false },
      max: 8,
    });
  }
  return pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  stem TEXT NOT NULL,
  answer TEXT DEFAULT '',
  analysis TEXT DEFAULT '',
  question_type TEXT DEFAULT '',
  difficulty TEXT DEFAULT '简单',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  student_answer TEXT,
  is_correct BOOLEAN,
  guide_rounds INTEGER,
  attempt_number INTEGER,
  practice_time TIMESTAMPTZ DEFAULT NOW()
);
`;

const SCHEMA_ALTER_SQL = `
ALTER TABLE records ADD COLUMN IF NOT EXISTS photo_key TEXT DEFAULT '';
ALTER TABLE records ADD COLUMN IF NOT EXISTS conversation_id TEXT DEFAULT '';
`;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await getPool().query(SCHEMA_SQL);
      await getPool().query(SCHEMA_ALTER_SQL);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  } else {
    // 已初始化过也补跑 ALTER，避免新字段在热更新后仍缺失
    await getPool().query(SCHEMA_ALTER_SQL);
  }
  await schemaReady;
}

class QueryBuilder {
  private table: string;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private selectRaw = "*";
  private selectOpts: SelectOpts = {};
  private filters: Filter[] = [];
  private orderBy: OrderBy | null = null;
  private insertRow: Record<string, unknown> | null = null;
  private updateRow: Record<string, unknown> | null = null;
  private wantSingle: "one" | "maybe" | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", opts: SelectOpts = {}) {
    // Supabase 风格：insert/update 后链式 .select() 表示 RETURNING，不能改成查询
    if (this.mode !== "insert" && this.mode !== "update") {
      this.mode = "select";
    }
    this.selectRaw = columns;
    this.selectOpts = opts;
    return this;
  }

  insert(row: Record<string, unknown>) {
    this.mode = "insert";
    this.insertRow = row;
    return this;
  }

  update(row: Record<string, unknown>) {
    this.mode = "update";
    this.updateRow = row;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: "=", value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ column, op: "ilike", value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: opts?.ascending !== false };
    return this;
  }

  single() {
    this.wantSingle = "one";
    return this;
  }

  maybeSingle() {
    this.wantSingle = "maybe";
    return this;
  }

  then<TResult1 = PgQueryResult, TResult2 = never>(
    onfulfilled?: ((value: PgQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private whereSql(params: unknown[], start = 1) {
    if (!this.filters.length) return { sql: "", next: start };
    const parts = this.filters.map((f, i) => {
      params.push(f.value);
      return `${quoteIdent(f.column)} ${f.op === "ilike" ? "ILIKE" : "="} $${start + i}`;
    });
    return { sql: ` WHERE ${parts.join(" AND ")}`, next: start + this.filters.length };
  }

  private async execute(): Promise<PgQueryResult> {
    try {
      await ensureSchema();
      const client = await getPool().connect();
      try {
        if (this.mode === "insert") return await this.runInsert(client);
        if (this.mode === "update") return await this.runUpdate(client);
        if (this.mode === "delete") return await this.runDelete(client);
        return await this.runSelect(client);
      } finally {
        client.release();
      }
    } catch (e) {
      return {
        data: this.wantSingle ? null : [],
        error: { message: e instanceof Error ? e.message : String(e) },
        count: null,
      };
    }
  }

  private async runInsert(client: PoolClient): Promise<PgQueryResult> {
    const row = this.insertRow || {};
    const keys = Object.keys(row);
    const params = keys.map((k) => row[k]);
    const cols = keys.map(quoteIdent).join(", ");
    const values = keys.map((_, i) => `$${i + 1}`).join(", ");
    const sql = `INSERT INTO ${quoteIdent(this.table)} (${cols}) VALUES (${values}) RETURNING *`;
    const res = await client.query(sql, params);
    return this.wrapRows(res);
  }

  private async runUpdate(client: PoolClient): Promise<PgQueryResult> {
    const row = this.updateRow || {};
    const keys = Object.keys(row);
    const params: unknown[] = keys.map((k) => row[k]);
    const sets = keys.map((k, i) => `${quoteIdent(k)} = $${i + 1}`).join(", ");
    const where = this.whereSql(params, keys.length + 1);
    const sql = `UPDATE ${quoteIdent(this.table)} SET ${sets}${where.sql} RETURNING *`;
    const res = await client.query(sql, params);
    return this.wrapRows(res);
  }

  private async runDelete(client: PoolClient): Promise<PgQueryResult> {
    const params: unknown[] = [];
    const where = this.whereSql(params);
    const sql = `DELETE FROM ${quoteIdent(this.table)}${where.sql}`;
    await client.query(sql, params);
    return { data: null, error: null, count: null };
  }

  private async runSelect(client: PoolClient): Promise<PgQueryResult> {
    const { columns, embeds } = parseSelect(this.selectRaw);
    const params: unknown[] = [];
    const where = this.whereSql(params);
    const order = this.orderBy
      ? ` ORDER BY ${quoteIdent(this.orderBy.column)} ${this.orderBy.ascending ? "ASC" : "DESC"}`
      : "";

    if (this.selectOpts.count === "exact" && this.selectOpts.head) {
      const sql = `SELECT COUNT(*)::int AS count FROM ${quoteIdent(this.table)}${where.sql}`;
      const res = await client.query(sql, params);
      return { data: null, error: null, count: res.rows[0]?.count ?? 0 };
    }

    const colSql = columns.includes("*")
      ? `${quoteIdent(this.table)}.*`
      : columns.map((c) => `${quoteIdent(this.table)}.${quoteIdent(c)}`).join(", ");
    const sql = `SELECT ${colSql} FROM ${quoteIdent(this.table)}${where.sql}${order}`;
    const res = await client.query(sql, params);
    const rows = res.rows as Record<string, unknown>[];
    if (embeds.length) await this.attachEmbeds(client, rows, embeds);
    return this.wrapRows({ rows } as QueryResult);
  }

  private async attachEmbeds(client: PoolClient, rows: Record<string, unknown>[], embeds: Embed[]) {
    for (const embed of embeds) {
      const fk =
        embed.table === "questions"
          ? "question_id"
          : embed.table === "users"
            ? "student_id"
            : `${embed.table.replace(/s$/, "")}_id`;
      const ids = [...new Set(rows.map((r) => r[fk]).filter((v) => v != null))];
      const map = new Map<unknown, Record<string, unknown>>();
      if (ids.length) {
        const cols = embed.columns.includes("*")
          ? "*"
          : ["id", ...embed.columns].filter((c, i, arr) => arr.indexOf(c) === i).map(quoteIdent).join(", ");
        const res = await client.query(
          `SELECT ${cols} FROM ${quoteIdent(embed.table)} WHERE ${quoteIdent("id")} = ANY($1)`,
          [ids]
        );
        for (const row of res.rows) map.set(row.id, row);
      }
      for (const row of rows) {
        row[embed.alias] = map.get(row[fk]) || null;
      }
    }
  }

  private wrapRows(res: Pick<QueryResult, "rows">): PgQueryResult {
    const rows = res.rows;
    if (this.wantSingle) {
      if (this.wantSingle === "one" && rows.length === 0) {
        return { data: null, error: { message: "未找到记录" }, count: 0 };
      }
      return { data: rows[0] ?? null, error: null, count: rows.length };
    }
    return { data: rows, error: null, count: rows.length };
  }
}

export function getPgClient() {
  return {
    from(table: string) {
      return new QueryBuilder(table);
    },
  };
}
