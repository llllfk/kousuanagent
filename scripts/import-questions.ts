/**
 * 题库导入脚本：按 QUESTION_SEED 逐题调用 AI 生成标准答案与分步解析，写入 questions 表。
 * 运行：npx tsx scripts/import-questions.ts
 * 结果会追加写入标准日志目录供核对。
 */
import "dotenv/config";
import { LLMClient, Config } from "coze-coding-dev-sdk";
import { getSupabaseClient } from "../src/storage/database/supabase-client";
import { QUESTION_SEED, type SeedQuestion } from "../src/lib/question-seed";

const LOG_PATH = "/app/work/logs/bypass//import.log";
const fs = require("fs");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync("/app/work/logs/bypass/", { recursive: true });
    fs.appendFileSync(LOG_PATH, line + "\n");
  } catch {}
}

const client = new LLMClient(new Config());

async function generateFor(seed: SeedQuestion) {
  const messages: Parameters<typeof client.invoke>[0] = [
    {
      role: "system",
      content:
        "你是一名经验丰富的小学六年级数学老师，擅长分数乘法应用题教学。你会收到一道人教版六年级上册分数乘法应用题，请给出标准答案与分步解析。要求：1) 答案为完整数值，能化简的分数写成最简分数形式（如 3/4），多问答案用顿号“、”分隔（如 2/3、1/4）；2) 解析分步骤书写，语言简洁、小学生能看懂，约 2~4 步；3) 只输出一个 JSON 对象，不要输出任何其他文字或 markdown 代码块，格式为 {\"answer\":\"...\",\"analysis\":\"...\"}。",
    },
    { role: "user", content: `题型：${seed.question_type}\n题目：${seed.stem}` },
  ];
  try {
    const resp = await client.invoke(messages, {
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.2,
    });
    const jsonMatch = (resp.content || "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 返回格式异常");
    const parsed = JSON.parse(jsonMatch[0]);
    const answer = String(parsed.answer || "").trim() || seed.fallbackAnswer;
    const analysis = String(parsed.analysis || "").trim() || seed.fallbackAnalysis;
    return { answer, analysis, fromAI: true };
  } catch (e: any) {
    return { answer: seed.fallbackAnswer, analysis: seed.fallbackAnalysis, fromAI: false, err: e?.message };
  }
}

async function main() {
  const supabase = getSupabaseClient();
  log(`开始导入，共 ${QUESTION_SEED.length} 道题`);

  // 已存在题目：按题干去重，跳过
  const { data: existing } = await supabase.from("questions").select("stem");
  const existingSet = new Set((existing || []).map((q: any) => q.stem));

  const results: any[] = [];
  let index = 0;

  const pool = async (seed: SeedQuestion) => {
    const local = index++; // 保持顺序
    if (existingSet.has(seed.stem)) {
      log(`[${local + 1}] 已存在，跳过：${seed.stem.slice(0, 24)}...`);
      results[local] = { stem: seed.stem, skipped: true };
      return;
    }
    const { answer, analysis, fromAI, err } = await generateFor(seed);
    const { data, error } = await supabase.from("questions").insert({
      stem: seed.stem,
      answer,
      analysis,
      question_type: seed.question_type,
      difficulty: seed.difficulty,
    }).select("id, stem, answer");
    if (error) {
      log(`[${local + 1}] 入库失败：${seed.stem.slice(0, 24)}... ${error.message}`);
      results[local] = { stem: seed.stem, failed: true, error: error.message };
      return;
    }
    log(`[${local + 1}] ${fromAI ? "AI生成" : "兜底"} → ${seed.stem.slice(0, 24)}... 答案=${answer}`);
    results[local] = data?.[0] || { stem: seed.stem, answer };
  };

  const concurrency = 5;
  const queue = [...QUESTION_SEED];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      await pool(item);
    }
  });
  await Promise.all(workers);

  const inserted = results.filter((r) => r && !r.skipped && !r.failed);
  const skipped = results.filter((r) => r && r.skipped);
  const failed = results.filter((r) => r && r.failed);
  log(`=== 导入完成：成功 ${inserted.length}，跳过 ${skipped.length}，失败 ${failed.length} ===`);
  log(`=== 生成结果列表（供核对）===`);
  for (const r of inserted) {
    log(`  id=${r.id} | ${String(r.stem || "").slice(0, 30)} | 答案=${r.answer}`);
  }
}

main().catch((e) => {
  log(`导入异常：${e?.message || e}`);
  process.exit(1);
});