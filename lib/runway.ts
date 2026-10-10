import {
  isKnownDebtType,
  type DebtRow,
  type ExpenseRow,
  type FinanceWorkbook,
  type SavingsRow,
} from "@/lib/sheet-finance";

const DAYS_PER_MONTH = 30;
const MAX_CHART_MONTHS = 24;
const MAX_DEBT_CHART_MONTHS = 60;

const INVESTED_TYPES = new Set(["retirement", "stocks", "stock", "brokerage"]);

export type SpendSource = "expenses" | "none";

export type RunwayPoint = {
  label: string;
  remainingCents: number;
};

export type NamedAmount = {
  name: string;
  amountCents: number;
};

export type DebtPayoff = {
  name: string;
  amountCents: number;
  minimumPaymentCents: number;
  months: number | null;
  payoffLabel: string | null;
  capped: boolean;
};

export type DebtPayoffPoint = {
  label: string;
  remainingCents: number;
};

export type RunwayProjection = {
  cashOnHandCents: number;
  investedCents: number;
  debtCents: number;
  monthlySpendCents: number;
  monthlyIncomeCents: number;
  netBurnCents: number;
  spendSource: SpendSource;
  totalDays: number | null;
  capped: boolean;
  reachesZero: boolean;
  zeroDateLabel: string | null;
  points: RunwayPoint[];
  expenses: NamedAmount[];
  income: NamedAmount[];
  savingsByType: NamedAmount[];
  debts: NamedAmount[];
  debtPayoffs: DebtPayoff[];
  debtPayoffPoints: DebtPayoffPoint[];
};

function addCalendarMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isInvestedSavings(type: string): boolean {
  return INVESTED_TYPES.has(type.trim().toLowerCase());
}

export function liquidSavingsCents(savings: SavingsRow[]): number {
  return savings.reduce((total, row) => {
    if (isInvestedSavings(row.type)) {
      return total;
    }
    return total + row.amountCents;
  }, 0);
}

export function investedSavingsCents(savings: SavingsRow[]): number {
  return savings.reduce((total, row) => {
    if (!isInvestedSavings(row.type)) {
      return total;
    }
    return total + row.amountCents;
  }, 0);
}

export function sumAmountCents(rows: Array<{ amountCents: number }>): number {
  return rows.reduce((total, row) => total + row.amountCents, 0);
}

export function isDebtCountedAsExpense(
  row: ExpenseRow,
  debts: DebtRow[]
): boolean {
  if (row.type && isKnownDebtType(row.type)) {
    return true;
  }

  const expenseName = row.name.trim().toLowerCase();
  return debts.some(
    (debt) =>
      debt.name.trim().toLowerCase() === expenseName &&
      debt.amountCents === row.costCents &&
      debt.amountCents > 0
  );
}

export function monthlyExpenseRows(
  workbook: FinanceWorkbook
): ExpenseRow[] {
  return (workbook.expenses ?? []).filter(
    (row) => !isDebtCountedAsExpense(row, workbook.debt ?? [])
  );
}

export function resolveMonthlySpend(workbook: FinanceWorkbook): {
  monthlySpendCents: number;
  spendSource: SpendSource;
} {
  if ((workbook.expenseFinalTotalCents ?? 0) > 0) {
    return {
      monthlySpendCents: workbook.expenseFinalTotalCents,
      spendSource: "expenses",
    };
  }

  const fromCost = monthlyExpenseRows(workbook).reduce(
    (total, row) => total + row.costCents,
    0
  );
  if (fromCost > 0) {
    return { monthlySpendCents: fromCost, spendSource: "expenses" };
  }

  return { monthlySpendCents: 0, spendSource: "none" };
}

export function formatRunwayDuration(totalDays: number): string {
  if (totalDays <= 0) {
    return "At $0 now";
  }

  const months = Math.trunc(totalDays / DAYS_PER_MONTH);
  const days = totalDays % DAYS_PER_MONTH;

  if (months === 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }

  const monthLabel = months === 1 ? "1 month" : `${months} months`;
  if (days === 0) {
    return monthLabel;
  }

  const dayLabel = days === 1 ? "1 day" : `${days} days`;
  return `${monthLabel}, ${dayLabel}`;
}

export function formatPayoffMonths(months: number): string {
  if (months <= 0) {
    return "Paid off";
  }

  const years = Math.trunc(months / 12);
  const leftoverMonths = months % 12;
  if (years === 0) {
    return months === 1 ? "1 month" : `${months} months`;
  }

  const yearLabel = years === 1 ? "1 year" : `${years} years`;
  if (leftoverMonths === 0) {
    return yearLabel;
  }

  const monthLabel =
    leftoverMonths === 1 ? "1 month" : `${leftoverMonths} months`;
  return `${yearLabel}, ${monthLabel}`;
}

export function monthsToPayOff(
  amountCents: number,
  minimumPaymentCents: number
): number | null {
  if (amountCents <= 0) {
    return 0;
  }
  if (minimumPaymentCents <= 0) {
    return null;
  }
  return Math.ceil(amountCents / minimumPaymentCents);
}

export function buildDebtPayoffs(
  debts: DebtRow[],
  from: Date = new Date()
): { payoffs: DebtPayoff[]; points: DebtPayoffPoint[] } {
  const payoffs = debts
    .filter((row) => row.amountCents > 0)
    .map((row) => {
      const months = monthsToPayOff(row.amountCents, row.minimumPaymentCents);
      const capped = months !== null && months > MAX_DEBT_CHART_MONTHS;
      return {
        name: row.name,
        amountCents: row.amountCents,
        minimumPaymentCents: row.minimumPaymentCents,
        months,
        payoffLabel:
          months === null
            ? null
            : formatMonthLabel(addCalendarMonths(from, months)),
        capped,
      };
    })
    .sort((a, b) => (b.months ?? -1) - (a.months ?? -1));

  const chartMonths = Math.min(
    MAX_DEBT_CHART_MONTHS,
    Math.max(
      12,
      ...payoffs.map((item) => item.months ?? 0),
      0
    )
  );

  const points: DebtPayoffPoint[] = [];
  for (let month = 0; month <= chartMonths; month += 1) {
    const remainingCents = debts.reduce((total, row) => {
      if (row.minimumPaymentCents <= 0) {
        return total + Math.max(0, row.amountCents);
      }
      return total + Math.max(0, row.amountCents - row.minimumPaymentCents * month);
    }, 0);

    points.push({
      label: month === 0 ? "Now" : formatMonthLabel(addCalendarMonths(from, month)),
      remainingCents,
    });

    if (month > 0 && remainingCents === 0) {
      break;
    }
  }

  return { payoffs, points };
}

function aggregateByName(
  rows: Array<{ name: string; amountCents: number }>
): NamedAmount[] {
  const byName = new Map<string, number>();
  for (const row of rows) {
    byName.set(row.name, (byName.get(row.name) ?? 0) + row.amountCents);
  }

  return [...byName.entries()]
    .map(([name, amountCents]) => ({ name, amountCents }))
    .filter((row) => row.amountCents !== 0)
    .sort((a, b) => b.amountCents - a.amountCents);
}

export function buildWorkbookRunway(
  workbook: FinanceWorkbook,
  from: Date = new Date()
): RunwayProjection {
  const cashOnHandCents = Math.max(0, liquidSavingsCents(workbook.savings));
  const investedCents = investedSavingsCents(workbook.savings);
  const debtCents = sumAmountCents(workbook.debt);
  const { monthlySpendCents, spendSource } = resolveMonthlySpend(workbook);
  const monthlyIncomeCents = sumAmountCents(workbook.income);
  const netBurnCents = monthlySpendCents;
  const expenses = monthlyExpenseRows(workbook)
    .map((row) => ({
      name: row.name,
      amountCents: row.costCents,
    }))
    .filter((row) => row.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);
  const income = workbook.income
    .map((row) => ({
      name: row.name,
      amountCents: row.amountCents,
    }))
    .filter((row) => row.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);
  const savingsByType = aggregateByName(
    workbook.savings.map((row) => ({
      name: row.type || "Other",
      amountCents: row.amountCents,
    }))
  );
  const debts = workbook.debt
    .map((row) => ({
      name: row.name,
      amountCents: row.amountCents,
    }))
    .filter((row) => row.amountCents !== 0)
    .sort((a, b) => b.amountCents - a.amountCents);
  const { payoffs: debtPayoffs, points: debtPayoffPoints } = buildDebtPayoffs(
    workbook.debt,
    from
  );
  const breakdown = {
    expenses,
    income,
    savingsByType,
    debts,
    debtPayoffs,
    debtPayoffPoints,
  };

  if (netBurnCents <= 0) {
    const monthlyChange = -netBurnCents;
    const points: RunwayPoint[] = [];
    for (let month = 0; month <= 12; month += 1) {
      points.push({
        label:
          month === 0 ? "Now" : formatMonthLabel(addCalendarMonths(from, month)),
        remainingCents: cashOnHandCents + month * monthlyChange,
      });
    }

    return {
      cashOnHandCents,
      investedCents,
      debtCents,
      monthlySpendCents,
      monthlyIncomeCents,
      netBurnCents,
      spendSource,
      totalDays: null,
      capped: false,
      reachesZero: false,
      zeroDateLabel: null,
      points,
      ...breakdown,
    };
  }

  if (cashOnHandCents === 0) {
    return {
      cashOnHandCents,
      investedCents,
      debtCents,
      monthlySpendCents,
      monthlyIncomeCents,
      netBurnCents,
      spendSource,
      totalDays: 0,
      capped: false,
      reachesZero: true,
      zeroDateLabel: formatDayLabel(from),
      points: [{ label: "Now", remainingCents: 0 }],
      ...breakdown,
    };
  }

  const totalDays = Math.trunc(
    (cashOnHandCents * DAYS_PER_MONTH) / netBurnCents
  );
  const capped = totalDays > MAX_CHART_MONTHS * DAYS_PER_MONTH;
  const chartMonths = capped
    ? MAX_CHART_MONTHS
    : Math.min(MAX_CHART_MONTHS, Math.trunc(totalDays / DAYS_PER_MONTH) + 1);

  const points: RunwayPoint[] = [
    { label: "Now", remainingCents: cashOnHandCents },
  ];

  let remaining = cashOnHandCents;
  for (let month = 1; month <= chartMonths; month += 1) {
    remaining -= netBurnCents;
    if (remaining > 0) {
      points.push({
        label: formatMonthLabel(addCalendarMonths(from, month)),
        remainingCents: remaining,
      });
      continue;
    }

    points.push({
      label: formatDayLabel(addDays(from, totalDays)),
      remainingCents: 0,
    });
    break;
  }

  return {
    cashOnHandCents,
    investedCents,
    debtCents,
    monthlySpendCents,
    monthlyIncomeCents,
    netBurnCents,
    spendSource,
    totalDays,
    capped,
    reachesZero: !capped,
    zeroDateLabel: capped ? null : formatDayLabel(addDays(from, totalDays)),
    points,
    ...breakdown,
  };
}
