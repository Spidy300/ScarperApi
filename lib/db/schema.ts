import { pgTable, timestamp, text, varchar, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  uid: varchar({ length: 255 }).notNull().unique(), // Firebase UID
  email: varchar({ length: 255 }).notNull().unique(),
  displayName: varchar({ length: 255 }),
  photoURL: text(),
  provider: varchar({ length: 50 }).notNull(), // 'email', 'google', etc.
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
