import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";

export type UserRecord = typeof usersTable.$inferSelect;

export async function findUserById(id: number): Promise<UserRecord | null> {
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return row ?? null;
}

export async function findUserByGoogleSub(
  googleSub: string
): Promise<UserRecord | null> {
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.googleSub, googleSub))
    .limit(1);
  return row ?? null;
}

export async function upsertGoogleUser(values: {
  googleSub: string;
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: number;
}): Promise<UserRecord> {
  const existing = await findUserByGoogleSub(values.googleSub);

  if (existing) {
    const [row] = await db
      .update(usersTable)
      .set({
        accessToken: values.accessToken,
        refreshToken: values.refreshToken ?? existing.refreshToken,
        accessTokenExpiresAt: values.accessTokenExpiresAt,
      })
      .where(eq(usersTable.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db.insert(usersTable).values(values).returning();
  return row;
}

export async function updateUserTokens(
  id: number,
  values: {
    accessToken: string;
    refreshToken?: string | null;
    accessTokenExpiresAt: number;
  }
): Promise<UserRecord | null> {
  const [row] = await db
    .update(usersTable)
    .set(values)
    .where(eq(usersTable.id, id))
    .returning();
  return row ?? null;
}

export async function updateSelectedSpreadsheet(
  id: number,
  selectedSpreadsheetId: string | null
): Promise<UserRecord | null> {
  const [row] = await db
    .update(usersTable)
    .set({ selectedSpreadsheetId })
    .where(eq(usersTable.id, id))
    .returning();
  return row ?? null;
}
