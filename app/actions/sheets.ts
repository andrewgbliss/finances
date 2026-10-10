"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/app/actions/auth";
import {
  listSpreadsheets,
  parseSpreadsheetId,
  readFinanceWorkbook,
} from "@/lib/google-sheets";
import type { FinanceWorkbook } from "@/lib/sheet-finance";
import type { SpreadsheetOption } from "@/lib/google-sheets";
import { updateSelectedSpreadsheet } from "@/src/db/repositories/users";

export async function getSpreadsheetOptions(): Promise<SpreadsheetOption[]> {
  const user = await requireCurrentUser();
  return listSpreadsheets(user.id);
}

export async function getSelectedWorkbook(): Promise<FinanceWorkbook | null> {
  const user = await requireCurrentUser();
  if (!user.selectedSpreadsheetId) {
    return null;
  }
  return readFinanceWorkbook(user.id, user.selectedSpreadsheetId);
}

export async function selectSpreadsheet(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const spreadsheetId =
    parseSpreadsheetId(String(formData.get("spreadsheetId") ?? "")) ??
    parseSpreadsheetId(String(formData.get("spreadsheetUrl") ?? ""));
  await updateSelectedSpreadsheet(user.id, spreadsheetId);
  revalidatePath("/finances");
  revalidatePath("/profile");
}
