/**
 * 判分模块：剥离单位、规范分数格式（3/4 与 0.75 视为等值），两问逐问比对。
 */

export type JudgeResult = "正确" | "部分正确" | "错误";

export interface JudgeOutcome {
  result: JudgeResult;
  correctCount: number;
  totalCount: number;
}

/** 常见单位字符（用于剥离），支持多字符单位 */
const UNIT_PATTERN =
  /(千米|米|分米|厘米|毫米|吨|千克|克|公斤|斤|个|名|人|本|件|支|箱|盒|瓶|块|只|头|匹|棵|朵|张|幅|条|根|段|层|步|圈|小时|分钟|秒|月|元|角|分|页|页．|筐|批|袋|课|师|倍|\?|？)|\s+/g;

/** 切分答案的多个组成部分（两问等） */
function splitParts(s: string): string[] {
  return s
    .split(/[、，,；;和且/]/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * 从一段文本中提取数值（支持分数 x/y 与小数/整数），并归一化为数值。
 * 返回 null 表示无法解析出数字。
 */
function extractNumber(token: string): number | null {
  const cleaned = token.replace(UNIT_PATTERN, "").trim();
  if (!cleaned) return null;

  // 优先匹配分数 a/b
  const frac = cleaned.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) {
    const a = parseInt(frac[1], 10);
    const b = parseInt(frac[2], 10);
    if (b === 0) return null;
    return a / b;
  }

  // 匹配十进制
  const dec = cleaned.match(/\d+(\.\d+)?/);
  if (dec) return parseFloat(dec[0]);

  return null;
}

/**
 * 判分核心函数。
 * @param reference 标准答案字符串，如 "3/4"、"2/3和1/4"
 * @param student   学生提交答案字符串
 */
export function judge(reference: string, student: string): JudgeOutcome {
  const refParts = splitParts(reference);
  const stuParts = splitParts(student);
  const totalCount = refParts.length || 1;

  if (refParts.length === 0) {
    // 参考答案无法拆出部分？退化为整段判空
    const ok = student.trim().length > 0;
    return { result: ok ? "错误" : "错误", correctCount: 0, totalCount: 1 };
  }

  let correctCount = 0;
  for (const refPart of refParts) {
    const refVal = extractNumber(refPart);
    // 学生端只要某一组成部分数值与参考组成部分相等即算该问正确（顺序无关逐个按序比对）
    if (refVal === null) continue;
    const matched = stuParts.some((sp) => {
      const sv = extractNumber(sp);
      return sv !== null && Math.abs(sv - refVal) < 1e-6;
    });
    if (matched) correctCount++;
  }

  let result: JudgeResult;
  if (correctCount === 0) result = "错误";
  else if (correctCount >= refParts.length) result = "正确";
  else result = "部分正确";

  return { result, correctCount, totalCount };
}