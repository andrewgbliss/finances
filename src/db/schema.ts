import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  googleSub: varchar({ length: 255 }).notNull().unique(),
  accessToken: text().notNull(),
  refreshToken: text(),
  accessTokenExpiresAt: integer().notNull(),
  selectedSpreadsheetId: varchar({ length: 255 }),
});
