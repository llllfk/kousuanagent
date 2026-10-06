/** 题型常量 */
export const QUESTION_TYPES = [
  "求一个数的几分之几",
  "连续求",
  "比一个数多或少几分之几",
  "两问复合",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ["简单", "中等", "较难"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PHOTO_QUESTION_TYPE = "拍题目";

export function isPhotoQuestion(stem?: string, questionType?: string): boolean {
  const type = questionType || "";
  const text = stem || "";
  return type === PHOTO_QUESTION_TYPE || text.startsWith("【拍题目】") || text === PHOTO_QUESTION_TYPE;
}

/**
 * 引导轮次计数（后端注入）。
 * 以会话维度记录；不落库，仅用于本轮练习内计数，换题即重建会话时重置。
 */
const roundMap = new Map<string, number>();

/** 初始化某会话的轮次（进入新题时调用） */
export function initRounds(conversationId: string): void {
  roundMap.set(conversationId, 0);
}

/** 推进一轮并返回当前轮次号（从 1 开始） */
export function advanceRound(conversationId: string): number {
  const cur = roundMap.get(conversationId) || 0;
  const next = cur + 1;
  roundMap.set(conversationId, next);
  return next;
}

/** 读取当前轮次（不推进） */
export function getRound(conversationId: string): number {
  return roundMap.get(conversationId) || 0;
}