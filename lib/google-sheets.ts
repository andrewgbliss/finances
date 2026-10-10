import "server-only";

import { refreshGoogleAccessToken } from "@/lib/google-oauth";
import {
  parseActions,
  parseDebt,
  parseExpenseFinalTotal,
  parseExpenses,
  parseIncome,
  parseSavings,
  type FinanceWorkbook,
} from "@/lib/sheet-finance";
import {
  findUserById,
  updateUserTokens,
  type UserRecord,
} from "@/src/db/repositories/users";

export type SpreadsheetOption = {
  id: string;
  name: string;
};

const SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

type DriveFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
  };
};

export function parseSpreadsheetId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const fromUrl = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (fromUrl?.[1] && fromUrl[1].length >= 20) {
    return fromUrl[1];
  }

  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

async function googleGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await googleErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function googleErrorMessage(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string; errors?: Array<{ reason?: string }> };
    };
    const message = parsed.error?.message?.trim();
    const reason = parsed.error?.errors?.[0]?.reason;
    if (
      reason === "accessNotConfigured" ||
      message?.includes("has not been used") ||
      message?.includes("is disabled")
    ) {
      return (
        message ??
        "Google Drive or Sheets API is disabled on this Cloud project. Enable both APIs, then retry."
      );
    }
    if (response.status === 401) {
      return "Google access expired. Sign in again to refresh Sheets permission.";
    }
    if (
      response.status === 403 ||
      reason === "PERMISSION_DENIED" ||
      message === "The caller does not have permission"
    ) {
      return "This Google account cannot open that spreadsheet. Share it with the account you used to sign in, or reconnect with the account that owns the sheet.";
    }
    if (message) {
      return message;
    }
  } catch {
    // Fall through to the status-only message.
  }
  return `Google API request failed (${response.status})`;
}

export async function getValidAccessToken(user: UserRecord): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (user.accessTokenExpiresAt - 60 > now) {
    return user.accessToken;
  }

  if (!user.refreshToken) {
    throw new Error("Google access expired. Sign in again.");
  }

  const refreshed = await refreshGoogleAccessToken(user.refreshToken);
  await updateUserTokens(user.id, {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
  });
  return refreshed.accessToken;
}

function isPermissionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("cannot open that spreadsheet") ||
      error.message.includes("does not have permission"))
  );
}

async function listDriveFiles(
  accessToken: string,
  query: string,
  includeSharedDrives: boolean
): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: query,
      fields: "nextPageToken,files(id,name,mimeType,shortcutDetails)",
      pageSize: "1000",
    });
    if (includeSharedDrives) {
      params.set("includeItemsFromAllDrives", "true");
      params.set("supportsAllDrives", "true");
    }
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const data = await googleGet<{
      nextPageToken?: string;
      files?: DriveFile[];
    }>(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      accessToken
    );

    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && files.length < 2000);

  return files;
}

async function listDriveFilesWithFallback(
  accessToken: string,
  query: string
): Promise<DriveFile[]> {
  try {
    return await listDriveFiles(accessToken, query, true);
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error;
    }
    return listDriveFiles(accessToken, query, false);
  }
}

function toSpreadsheetOption(file: DriveFile): SpreadsheetOption | null {
  if (file.mimeType === SHEET_MIME && file.id && file.name) {
    return { id: file.id, name: file.name };
  }

  if (
    file.mimeType === SHORTCUT_MIME &&
    file.shortcutDetails?.targetMimeType === SHEET_MIME &&
    file.shortcutDetails.targetId &&
    file.name
  ) {
    return {
      id: file.shortcutDetails.targetId,
      name: file.name,
    };
  }

  return null;
}

export async function listSpreadsheets(
  userId: number
): Promise<SpreadsheetOption[]> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Unauthorized");
  }

  const accessToken = await getValidAccessToken(user);
  let files = await listDriveFilesWithFallback(
    accessToken,
    `(mimeType='${SHEET_MIME}' or mimeType='${SHORTCUT_MIME}') and trashed=false`
  );

  if (files.length === 0) {
    files = await listDriveFilesWithFallback(accessToken, "trashed=false");
  }

  const seen = new Set<string>();
  const options: SpreadsheetOption[] = [];
  for (const file of files) {
    const option = toSpreadsheetOption(file);
    if (!option || seen.has(option.id)) {
      continue;
    }
    seen.add(option.id);
    options.push(option);
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

export async function readFinanceWorkbook(
  userId: number,
  spreadsheetId: string
): Promise<FinanceWorkbook> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Unauthorized");
  }

  const accessToken = await getValidAccessToken(user);
  const wantedTabs = ["Expenses", "Savings", "Income", "Debt", "Actions"];
  const meta = await googleGet<{
    sheets?: Array<{ properties?: { title?: string } }>;
  }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=sheets.properties.title`,
    accessToken
  );
  const present = new Set(
    (meta.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title))
  );
  const ranges = wantedTabs.filter((title) => present.has(title));

  const byTab = new Map<string, string[][]>();
  if (ranges.length > 0) {
    const rangeQuery = ranges
      .map((range) => `ranges=${encodeURIComponent(range)}`)
      .join("&");
    const data = await googleGet<{
      valueRanges?: Array<{ range?: string; values?: string[][] }>;
    }>(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values:batchGet?${rangeQuery}&majorDimension=ROWS`,
      accessToken
    );

    for (const valueRange of data.valueRanges ?? []) {
      const tab = (valueRange.range ?? "").split("!")[0]?.replace(/'/g, "") ?? "";
      byTab.set(tab, valueRange.values ?? []);
    }
  }

  const expenseValues = byTab.get("Expenses") ?? [];
  return {
    spreadsheetId,
    expenses: parseExpenses(expenseValues),
    expenseFinalTotalCents: parseExpenseFinalTotal(expenseValues),
    savings: parseSavings(byTab.get("Savings") ?? []),
    income: parseIncome(byTab.get("Income") ?? []),
    debt: parseDebt(byTab.get("Debt") ?? []),
    actions: parseActions(byTab.get("Actions") ?? []),
  };
}
