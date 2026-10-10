import { dollarsToCents } from "@/lib/money";

export const SAVINGS_TYPES = [
  "Retirement",
  "Checking",
  "Savings",
  "Money Market",
  "Growth Cert",
  "Stocks",
] as const;

export const DEBT_TYPES = ["Credit Card", "Loan"] as const;

export type SavingsType = (typeof SAVINGS_TYPES)[number];
export type DebtType = (typeof DEBT_TYPES)[number];

export type ExpenseRow = {
  name: string;
  type: string;
  costCents: number;
  finalTotalCents: number;
};

export type SavingsRow = {
  name: string;
  type: string;
  amountCents: number;
};

export type DebtRow = {
  name: string;
  type: string;
  amountCents: number;
  minimumPaymentCents: number;
};

export type IncomeRow = {
  name: string;
  amountCents: number;
};

export type ActionRow = {
  name: string;
};

export type FinanceWorkbook = {
  spreadsheetId: string;
  expenses: ExpenseRow[];
  expenseFinalTotalCents: number;
  savings: SavingsRow[];
  income: IncomeRow[];
  debt: DebtRow[];
  actions: ActionRow[];
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function looksLikeHeader(cells: string[], expected: string[]): boolean {
  const normalized = cells.map(normalizeHeader);
  return expected.some((header) => normalized.includes(normalizeHeader(header)));
}

function cell(row: string[], index: number): string {
  const value = row[index];
  if (value == null || value === "") {
    return "";
  }
  return String(value).trim();
}

function columnIndexFuzzy(headers: string[], match: (header: string) => boolean): number {
  return headers.map(normalizeHeader).findIndex(match);
}

function columnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const index = normalized.indexOf(normalizeHeader(alias));
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

function dataRows(values: string[][], expectedHeaders: string[]): string[][] {
  if (values.length === 0) {
    return [];
  }
  if (looksLikeHeader(values[0] ?? [], expectedHeaders)) {
    return values.slice(1);
  }
  return values;
}

const COST_ALIASES = ["cost", "monthly cost", "amount", "monthly"];
const SUMMARY_LABELS = new Set([
  "final total",
  "total",
  "grand total",
  "subtotal",
  "sum",
]);

function isSummaryLabel(value: string): boolean {
  return SUMMARY_LABELS.has(normalizeHeader(value));
}

function findHeaderRowIndex(
  values: string[][],
  nameAliases: string[],
  valueAliases: string[]
): number {
  const limit = Math.min(values.length, 15);
  for (let index = 0; index < limit; index += 1) {
    const normalized = (values[index] ?? []).map(normalizeHeader);
    const hasName = nameAliases.some((alias) =>
      normalized.includes(normalizeHeader(alias))
    );
    const hasValue = valueAliases.some((alias) =>
      normalized.includes(normalizeHeader(alias))
    );
    if (hasName && hasValue) {
      return index;
    }
  }
  for (let index = 0; index < limit; index += 1) {
    const normalized = (values[index] ?? []).map(normalizeHeader);
    if (nameAliases.some((alias) => normalized.includes(normalizeHeader(alias)))) {
      return index;
    }
  }
  return 0;
}

function pickValueColumn(
  headers: string[],
  aliases: string[],
  fallback: number
): number {
  const matched = columnIndex(headers, aliases);
  if (matched >= 0 && !isSummaryLabel(headers[matched] ?? "")) {
    return matched;
  }

  const normalized = headers.map(normalizeHeader);
  for (let index = 0; index < normalized.length; index += 1) {
    if (
      normalized[index] !== "name" &&
      normalized[index] !== "type" &&
      !SUMMARY_LABELS.has(normalized[index])
    ) {
      return index === 0 ? fallback : index;
    }
  }
  return fallback;
}

export function extractLabeledAmount(
  values: string[][],
  label: string
): number {
  for (const row of values.slice(0, 15)) {
    for (let index = 0; index < row.length; index += 1) {
      if (normalizeHeader(row[index] ?? "") !== normalizeHeader(label)) {
        continue;
      }
      for (let next = index + 1; next < row.length; next += 1) {
        const raw = cell(row, next);
        if (raw) {
          return dollarsToCents(raw);
        }
      }
    }
  }
  return 0;
}

export function parseExpenses(values: string[][]): ExpenseRow[] {
  if (values.length === 0) {
    return [];
  }

  const headerIndex = findHeaderRowIndex(
    values,
    ["name", "expense"],
    COST_ALIASES
  );
  const headers = values[headerIndex] ?? ["Name", "Cost", "Final Total"];
  const nameIndex = Math.max(0, columnIndex(headers, ["name", "expense"]));
  const typeIndex = columnIndex(headers, ["type"]);
  const costIndex = pickValueColumn(headers, COST_ALIASES, 1);

  return values
    .slice(headerIndex + 1)
    .map((row) => ({
      name: cell(row, nameIndex),
      type: typeIndex === -1 ? "" : cell(row, typeIndex),
      costCents: dollarsToCents(cell(row, costIndex)),
      finalTotalCents: 0,
    }))
    .filter((row) => row.name.length > 0 && !isSummaryLabel(row.name));
}

export function parseExpenseFinalTotal(values: string[][]): number {
  const labeled = extractLabeledAmount(values, "Final Total");
  if (labeled > 0) {
    return labeled;
  }

  const headerIndex = findHeaderRowIndex(
    values,
    ["name", "expense"],
    COST_ALIASES
  );
  const headers = values[headerIndex] ?? [];
  const totalIndex = columnIndex(headers, ["final total"]);
  if (totalIndex === -1) {
    return 0;
  }

  for (const row of values.slice(headerIndex + 1, headerIndex + 4)) {
    const amount = dollarsToCents(cell(row, totalIndex));
    if (amount > 0) {
      return amount;
    }
  }
  return 0;
}

export function parseSavings(values: string[][]): SavingsRow[] {
  const rows = values[0] ? dataRows(values, ["Name", "Type", "Amount"]) : [];
  const headers = looksLikeHeader(values[0] ?? [], ["Name", "Type", "Amount"])
    ? (values[0] ?? [])
    : ["Name", "Type", "Amount"];
  const nameIndex = Math.max(0, columnIndex(headers, ["name"]));
  const typeIndex = columnIndex(headers, ["type"]) === -1 ? 1 : columnIndex(headers, ["type"]);
  const amountIndex =
    columnIndex(headers, ["amount"]) === -1 ? 2 : columnIndex(headers, ["amount"]);

  return rows
    .map((row) => ({
      name: cell(row, nameIndex),
      type: cell(row, typeIndex),
      amountCents: dollarsToCents(cell(row, amountIndex)),
    }))
    .filter((row) => row.name.length > 0);
}

export function parseIncome(values: string[][]): IncomeRow[] {
  const rows = values[0] ? dataRows(values, ["Name", "Amount"]) : [];
  const headers = looksLikeHeader(values[0] ?? [], ["Name", "Amount"])
    ? (values[0] ?? [])
    : ["Name", "Amount"];
  const nameIndex = Math.max(0, columnIndex(headers, ["name", "income"]));
  const amountIndex =
    columnIndex(headers, ["amount", "gross", "monthly gross"]) === -1
      ? 1
      : columnIndex(headers, ["amount", "gross", "monthly gross"]);

  return rows
    .map((row) => ({
      name: cell(row, nameIndex),
      amountCents: dollarsToCents(cell(row, amountIndex)),
    }))
    .filter((row) => row.name.length > 0);
}

function mergeHeaderRows(top: string[], next: string[] | undefined): string[] {
  if (!next) {
    return top;
  }

  const nextName = normalizeHeader(next[0] ?? "");
  const nextLooksLikeData =
    nextName.length > 0 &&
    nextName !== "name" &&
    !isSummaryLabel(nextName) &&
    !nextName.includes("min") &&
    !nextName.includes("payment");
  if (nextLooksLikeData) {
    return top;
  }

  const width = Math.max(top.length, next.length);
  return Array.from({ length: width }, (_, index) =>
    `${top[index] ?? ""} ${next[index] ?? ""}`.trim()
  );
}

function findDebtAmountColumn(headers: string[]): number {
  const exact = columnIndex(headers, ["amount", "balance", "owed"]);
  if (exact >= 0) {
    return exact;
  }

  const fuzzy = columnIndexFuzzy(
    headers,
    (header) =>
      (header.includes("amount") || header.includes("balance") || header.includes("owed")) &&
      !header.includes("min") &&
      !header.includes("payment")
  );
  if (fuzzy >= 0) {
    return fuzzy;
  }

  return pickValueColumn(headers, ["amount", "balance", "owed"], 2);
}

function findDebtMinimumColumn(headers: string[], amountIndex: number): number {
  const exact = columnIndex(headers, [
    "minimum payment monthly",
    "minimum payment",
    "min payment monthly",
    "min payment",
    "monthly minimum",
    "monthly payment",
    "minimum",
  ]);
  if (exact >= 0 && exact !== amountIndex) {
    return exact;
  }

  const fuzzy = columnIndexFuzzy(headers, (header) => {
    if (header.includes("minimum")) {
      return true;
    }
    if (header.includes("min") && (header.includes("pay") || header.includes("pmt"))) {
      return true;
    }
    return header.includes("monthly") && header.includes("pay");
  });
  if (fuzzy >= 0 && fuzzy !== amountIndex) {
    return fuzzy;
  }

  if (amountIndex >= 0 && amountIndex + 1 < headers.length) {
    const next = normalizeHeader(headers[amountIndex + 1] ?? "");
    if (next && next !== "type" && next !== "name") {
      return amountIndex + 1;
    }
  }

  return headers.length > 3 ? 3 : -1;
}

export function parseDebt(values: string[][]): DebtRow[] {
  if (values.length === 0) {
    return [];
  }

  const headerIndex = findHeaderRowIndex(
    values,
    ["name"],
    ["amount", "balance", "minimum", "min"]
  );
  const merged = mergeHeaderRows(values[headerIndex] ?? [], values[headerIndex + 1]);
  const usedTwoHeaderRows =
    merged !== (values[headerIndex] ?? []) &&
    merged.some((header, index) => header !== (values[headerIndex]?.[index] ?? ""));
  const headers = merged.length > 0 ? merged : ["Name", "Type", "Amount", "Minimum Payment"];
  const nameIndex = Math.max(0, columnIndex(headers, ["name"]));
  const typeIndex = columnIndex(headers, ["type"]);
  const amountIndex = findDebtAmountColumn(headers);
  const headerMinimum = findDebtMinimumColumn(headers, amountIndex);
  const scannedMinimum = values
    .slice(0, 15)
    .map((row) => findDebtMinimumColumn(row, amountIndex))
    .find((index) => index >= 0);
  const widest = values.reduce((width, row) => Math.max(width, row.length), 0);
  const minimumIndex =
    headerMinimum >= 0
      ? headerMinimum
      : scannedMinimum !== undefined
        ? scannedMinimum
        : widest > amountIndex + 1
          ? amountIndex + 1
          : -1;
  const dataStart = headerIndex + (usedTwoHeaderRows ? 2 : 1);

  return values
    .slice(dataStart)
    .map((row) => ({
      name: cell(row, nameIndex),
      type: typeIndex === -1 ? "" : cell(row, typeIndex),
      amountCents: dollarsToCents(cell(row, amountIndex)),
      minimumPaymentCents:
        minimumIndex === -1 ? 0 : dollarsToCents(cell(row, minimumIndex)),
    }))
    .filter((row) => row.name.length > 0 && !isSummaryLabel(row.name));
}

export function parseActions(values: string[][]): ActionRow[] {
  const rows = values[0] ? dataRows(values, ["Name"]) : [];
  const headers = looksLikeHeader(values[0] ?? [], ["Name"])
    ? (values[0] ?? [])
    : ["Name"];
  const nameIndex = Math.max(0, columnIndex(headers, ["name", "action"]));

  return rows
    .map((row) => ({ name: cell(row, nameIndex) }))
    .filter((row) => row.name.length > 0);
}

export function isKnownSavingsType(value: string): value is SavingsType {
  return (SAVINGS_TYPES as readonly string[]).includes(value);
}

export function isKnownDebtType(value: string): value is DebtType {
  const normalized = value.trim().toLowerCase();
  return (DEBT_TYPES as readonly string[]).some(
    (type) => type.toLowerCase() === normalized
  );
}
