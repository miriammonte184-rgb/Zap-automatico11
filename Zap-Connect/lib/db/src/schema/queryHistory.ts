import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const queryHistoryTable = pgTable("query_history", {
  id: serial("id").primaryKey(),
  queryType: text("query_type").notNull(),
  queryValue: text("query_value").notNull(),
  phoneNumber: text("phone_number"),
  result: text("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQueryHistorySchema = createInsertSchema(queryHistoryTable).omit({ id: true, createdAt: true });
export type InsertQueryHistory = z.infer<typeof insertQueryHistorySchema>;
export type QueryHistory = typeof queryHistoryTable.$inferSelect;
