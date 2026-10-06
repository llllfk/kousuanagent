import { pgTable, serial, integer, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表：学生 / 老师
export const users = pgTable("users", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 128 }).notNull(),
	role: varchar("role", { length: 20 }).notNull().default("student"), // student | teacher
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 题目表
export const questions = pgTable("questions", {
	id: serial().primaryKey(),
	stem: text("stem").notNull(),                       // 题干
	answer: text("answer").notNull().default(""),       // 标准答案（支持分数如 3/4）
	analysis: text("analysis").notNull().default(""),   // 分步解析
	question_type: varchar("question_type", { length: 50 }).notNull().default(""), // 题型
	difficulty: varchar("difficulty", { length: 20 }).notNull().default("简单"),   // 简单/中等/较难
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 练习记录表
export const records = pgTable("records", {
	id: serial().primaryKey(),
	student_id: integer("student_id").notNull().references(() => users.id),
	question_id: integer("question_id").notNull().references(() => questions.id),
	student_answer: text("student_answer"),      // 学生提交的答案
	is_correct: boolean("is_correct").notNull().default(false), // 是否正确
	guide_rounds: integer("guide_rounds").notNull().default(0), // 引导轮次（第几轮提交）
	attempt_number: integer("attempt_number").notNull().default(1), // 第几次作答
	practice_time: timestamp("practice_time", { withTimezone: true }).defaultNow().notNull(),
	photo_key: text("photo_key").notNull().default(""), // 拍题照片（Coze S3 object key）
});