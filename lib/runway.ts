const DAYS_PER_MONTH = 30;
const MAX_CHART_MONTHS = 24;

export type SpendSource = "budget" | "ledger" | "none";

export type RunwayPoint = {
  label: string;
  remainingCents: number;
};

export type RunwayProjection = {
  cashOnHandCents: number;
  monthlySpendCents: number;
  monthlyIncomeCents: number;
  netBurnCents: number;
  spendSource: SpendSource;
  totalDays: number | null;
  capped: boolean;
  reachesZero: boolean;
  zeroDateLabel: string | null;
  points: RunwayPoint[];
};

type TransactionLike = {
  date: string;
  amountCents: number;
};

function roundDivide(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.trunc((numerator + Math.trunc(denominator / 2)) / denominator);
}

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

export function averageMonthlySpendCents(
  transactions: TransactionLike[]
): number {
  if (transactions.length === 0) {
    return 0;
  }

  const byMonth = new Map<string, number>();
  for (const transaction of transactions) {
    const key = transaction.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + transaction.amountCents);
  }

  let total = 0;
  for (const amount of byMonth.values()) {
    total += amount;
  }

  return roundDivide(total, byMonth.size);
}

export function resolveMonthlySpend(input: {
  budgetCents: number;
  transactions: TransactionLike[];
}): { monthlySpendCents: number; spendSource: SpendSource } {
  if (input.budgetCents > 0) {
    return { monthlySpendCents: input.budgetCents, spendSource: "budget" };
  }

  const ledgerSpend = averageMonthlySpendCents(input.transactions);
  if (ledgerSpend > 0) {
    return { monthlySpendCents: ledgerSpend, spendSource: "ledger" };
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

export function buildRunwayProjection(input: {
  cashOnHandCents: number;
  budgetCents: number;
  incomeCents: number;
  transactions: TransactionLike[];
  from?: Date;
}): RunwayProjection {
  const from = input.from ?? new Date();
  const { monthlySpendCents, spendSource } = resolveMonthlySpend({
    budgetCents: input.budgetCents,
    transactions: input.transactions,
  });
  const monthlyIncomeCents = input.incomeCents > 0 ? input.incomeCents : 0;
  const netBurnCents = monthlySpendCents - monthlyIncomeCents;
  const cashOnHandCents = input.cashOnHandCents > 0 ? input.cashOnHandCents : 0;

  if (netBurnCents <= 0) {
    const points: RunwayPoint[] = [];
    const monthlyChange = -netBurnCents;
    for (let month = 0; month <= 12; month += 1) {
      points.push({
        label: month === 0 ? "Now" : formatMonthLabel(addCalendarMonths(from, month)),
        remainingCents: cashOnHandCents + month * monthlyChange,
      });
    }

    return {
      cashOnHandCents,
      monthlySpendCents,
      monthlyIncomeCents,
      netBurnCents,
      spendSource,
      totalDays: null,
      capped: false,
      reachesZero: false,
      zeroDateLabel: null,
      points,
    };
  }

  if (cashOnHandCents === 0) {
    return {
      cashOnHandCents,
      monthlySpendCents,
      monthlyIncomeCents,
      netBurnCents,
      spendSource,
      totalDays: 0,
      capped: false,
      reachesZero: true,
      zeroDateLabel: formatDayLabel(from),
      points: [{ label: "Now", remainingCents: 0 }],
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
    monthlySpendCents,
    monthlyIncomeCents,
    netBurnCents,
    spendSource,
    totalDays,
    capped,
    reachesZero: !capped && cashOnHandCents >= 0,
    zeroDateLabel: capped ? null : formatDayLabel(addDays(from, totalDays)),
    points,
  };
}
