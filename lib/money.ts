export function dollarsToCents(value: string | number): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(value.replace(/[$,\s]/g, ""));

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function centsToDollars(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  return `${sign}${dollars}.${remainder.toString().padStart(2, "0")}`;
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

export function percentToBps(value: string | number): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(value.replace(/[%\s]/g, ""));

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function bpsToPercent(bps: number): string {
  const sign = bps < 0 ? "-" : "";
  const absolute = Math.abs(bps);
  const whole = Math.floor(absolute / 100);
  const fraction = absolute % 100;
  return `${sign}${whole}.${fraction.toString().padStart(2, "0")}`;
}

export function availableCreditCents(
  creditLimitCents: number,
  balanceCents: number
): number {
  const available = creditLimitCents - balanceCents;
  return available > 0 ? available : 0;
}
