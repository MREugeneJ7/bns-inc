import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export interface CompatibilityChange {
  id: string;
  path: string;
  description: string;
  action: "exclude" | "replace";
  before?: string;
  after?: string;
  applied: boolean;
}

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  mainFile: text("main_file"),
  engine: text("engine").notNull().default("pdflatex"),
  compatibility: jsonb("compatibility").$type<CompatibilityChange[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  parentId: uuid("parent_id"),
  slug: text("slug").notNull(),
  filePath: text("file_path"),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("texto"),
  source: text("source").notNull(),
  words: integer("words").notNull().default(0),
  blocks: integer("blocks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Original ZIP entries. Editable text lives in documents; originals are never overwritten. */
export const projectFiles = pgTable("project_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  original: text("original").notNull(), // exact bytes encoded as base64, including original text encoding
  isText: boolean("is_text").notNull(),
  size: integer("size").notNull(),
  excluded: boolean("excluded").notNull().default(false),
}, (table) => [uniqueIndex("project_files_project_path").on(table.projectId, table.path)]);

export type ProjectRow = typeof projects.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
