"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCents } from "@/lib/money";
import {
  formatRunwayDuration,
  type RunwayProjection,
} from "@/lib/runway";

const chartConfig = {
  remainingCents: {
    label: "In the bank",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const spendSourceLabel: Record<RunwayProjection["spendSource"], string> = {
  budget: "Monthly spend from your budget",
  ledger: "Monthly spend from the ledger",
  none: "Add a budget or spending to estimate burn",
};

function runwayHeadline(projection: RunwayProjection): string {
  if (projection.netBurnCents <= 0) {
    if (projection.monthlySpendCents === 0 && projection.monthlyIncomeCents === 0) {
      return "No burn yet";
    }
    return "Not burning";
  }

  if (projection.totalDays === null) {
    return "Not burning";
  }

  if (projection.capped) {
    return "24+ months";
  }

  return formatRunwayDuration(projection.totalDays);
}

function runwayDetail(projection: RunwayProjection): string {
  if (projection.netBurnCents < 0) {
    return `Surplus ${formatCents(-projection.netBurnCents)}/mo. Cash is holding or growing.`;
  }

  if (projection.netBurnCents === 0) {
    return spendSourceLabel[projection.spendSource];
  }

  if (projection.reachesZero && projection.zeroDateLabel) {
    return `Hits $0 on ${projection.zeroDateLabel}`;
  }

  if (projection.capped) {
    return "Still above $0 after 24 months at this burn";
  }

  return spendSourceLabel[projection.spendSource];
}

export function RunwayChart({ projection }: { projection: RunwayProjection }) {
  const chartData = projection.points;
  const burnRateCents =
    projection.netBurnCents > 0 ? projection.netBurnCents : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runway</CardTitle>
        <CardDescription>
          Cash plus available credit, spent at the current monthly burn, until $0.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Burn rate</p>
            <p className="font-heading text-2xl font-medium">
              {formatCents(burnRateCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Spend {formatCents(projection.monthlySpendCents)} minus income{" "}
              {formatCents(projection.monthlyIncomeCents)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time until $0</p>
            <p className="font-heading text-2xl font-medium">
              {runwayHeadline(projection)}
            </p>
            <p className="text-xs text-muted-foreground">
              {runwayDetail(projection)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Starting balance</p>
            <p className="font-heading text-2xl font-medium">
              {formatCents(projection.cashOnHandCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              {spendSourceLabel[projection.spendSource]}
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              dataKey="remainingCents"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={72}
              tickFormatter={(value: number) => formatCents(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCents(Number(value ?? 0))}
                />
              }
            />
            <Area
              dataKey="remainingCents"
              name="remainingCents"
              type="linear"
              fill="var(--color-remainingCents)"
              fillOpacity={0.2}
              stroke="var(--color-remainingCents)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
