"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCents, formatCentsCompact } from "@/lib/money";
import {
  formatPayoffMonths,
  formatRunwayDuration,
  type NamedAmount,
  type RunwayProjection,
} from "@/lib/runway";

const runwayConfig = {
  remainingCents: {
    label: "In the bank",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const expenseConfig = {
  amountCents: {
    label: "Cost",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const incomeConfig = {
  amountCents: {
    label: "Income",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const debtConfig = {
  amountCents: {
    label: "Debt",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const debtPayoffConfig = {
  remainingCents: {
    label: "Remaining debt",
    color: "var(--chart-5)",
  },
  months: {
    label: "Months",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const leftoverConfig = {
  amountCents: {
    label: "Amount",
    color: "var(--chart-2)",
  },
  Income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  Expenses: {
    label: "Expenses",
    color: "var(--chart-3)",
  },
  leftover: {
    label: "Can save",
    color: "var(--chart-4)",
  },
  shortfall: {
    label: "Shortfall",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

const spendSourceLabel: Record<RunwayProjection["spendSource"], string> = {
  expenses: "Monthly expenses from the Expenses tab. Debt is not included.",
  none: "Add expenses to estimate burn",
};

const TYPE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

function runwayHeadline(projection: RunwayProjection): string {
  if (projection.netBurnCents <= 0) {
    return projection.monthlySpendCents === 0 ? "No burn yet" : "Not burning";
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
  if (projection.netBurnCents <= 0) {
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

function chartKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other";
}

function typeChartConfig(rows: NamedAmount[]): ChartConfig {
  return Object.fromEntries(
    rows.map((row, index) => [
      chartKey(row.name),
      {
        label: row.name,
        color: TYPE_COLORS[index % TYPE_COLORS.length],
      },
    ])
  );
}

function barHeight(count: number): number {
  return Math.max(180, count * 36 + 48);
}

function MonthlyLeftoverChart({
  incomeCents,
  expenseCents,
}: {
  incomeCents: number;
  expenseCents: number;
}) {
  const leftoverCents = incomeCents - expenseCents;
  const canSave = leftoverCents >= 0;
  const chartData = [
    { name: "Income", amountCents: incomeCents, fill: "var(--color-Income)" },
    { name: "Expenses", amountCents: expenseCents, fill: "var(--color-Expenses)" },
    {
      name: canSave ? "Can save" : "Shortfall",
      amountCents: Math.abs(leftoverCents),
      fill: canSave ? "var(--color-leftover)" : "var(--color-shortfall)",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly leftover</CardTitle>
        <CardDescription>
          What you can save each month from income minus expense costs. Debt
          balances are not included. This does not change runway.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-heading text-2xl font-medium text-[var(--chart-1)]">
              {formatCents(incomeCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="font-heading text-2xl font-medium text-[var(--chart-3)]">
              {formatCents(expenseCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {canSave ? "Can save" : "Shortfall"}
            </p>
            <p
              className={`font-heading text-2xl font-medium ${
                canSave ? "text-[var(--chart-4)]" : "text-destructive"
              }`}
            >
              {formatCents(leftoverCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {canSave
                ? `${formatCents(leftoverCents * 12)} if this holds for a year`
                : "Spending more than monthly gross"}
            </p>
          </div>
        </div>

        {incomeCents === 0 && expenseCents === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add Income and Expenses in the sheet to estimate leftover.
          </p>
        ) : (
          <ChartContainer
            config={leftoverConfig}
            className="aspect-auto h-64 w-full"
          >
            <BarChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={72}
                tickFormatter={(value: number) => formatCentsCompact(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCents(Number(value ?? 0))}
                  />
                }
              />
              <Bar dataKey="amountCents" name="amountCents" radius={4}>
                {chartData.map((row) => (
                  <Cell key={row.name} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function FinanceCharts({ projection }: { projection: RunwayProjection }) {
  const burnRateCents =
    projection.netBurnCents > 0 ? projection.netBurnCents : 0;
  const savingsConfig = typeChartConfig(projection.savingsByType);
  const savingsPieData = projection.savingsByType.map((row, index) => ({
    ...row,
    key: chartKey(row.name),
    fill: TYPE_COLORS[index % TYPE_COLORS.length],
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Runway</CardTitle>
          <CardDescription>
            Liquid cash spent at the current monthly expense burn, until $0.
            Income is not included. Retirement and stocks stay out of runway.
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
                {spendSourceLabel[projection.spendSource]}
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
                Invested {formatCents(projection.investedCents)} · Debt{" "}
                {formatCents(projection.debtCents)}
              </p>
            </div>
          </div>

          <ChartContainer
            config={runwayConfig}
            className="aspect-auto h-64 w-full"
          >
            <AreaChart
              data={projection.points}
              margin={{ left: 8, right: 12, top: 8 }}
            >
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
                tickFormatter={(value: number) => formatCentsCompact(value)}
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

      <MonthlyLeftoverChart
        incomeCents={projection.monthlyIncomeCents}
        expenseCents={projection.monthlySpendCents}
      />

      <section className="grid gap-4 xl:col-span-2 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense breakdown</CardTitle>
            <CardDescription>
              Monthly cost by line item from the Expenses tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projection.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expense amounts to chart.
              </p>
            ) : (
              <ChartContainer
                config={expenseConfig}
                className="aspect-auto w-full"
                style={{ height: barHeight(projection.expenses.length) }}
              >
                <BarChart
                  data={projection.expenses}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatCentsCompact(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={112}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCents(Number(value ?? 0))}
                      />
                    }
                  />
                  <Bar
                    dataKey="amountCents"
                    name="amountCents"
                    fill="var(--color-amountCents)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income breakdown</CardTitle>
            <CardDescription>
              Monthly gross by line item from the Income tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projection.income.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No income amounts to chart.
              </p>
            ) : (
              <ChartContainer
                config={incomeConfig}
                className="aspect-auto w-full"
                style={{ height: barHeight(projection.income.length) }}
              >
                <BarChart
                  data={projection.income}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatCentsCompact(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={112}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCents(Number(value ?? 0))}
                      />
                    }
                  />
                  <Bar
                    dataKey="amountCents"
                    name="amountCents"
                    fill="var(--color-amountCents)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings breakdown</CardTitle>
            <CardDescription>
              Cash and investments grouped by type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projection.savingsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No savings amounts to chart.
              </p>
            ) : (
              <ChartContainer
                config={savingsConfig}
                className="aspect-auto mx-auto h-72 w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="key"
                        formatter={(value) => formatCents(Number(value ?? 0))}
                      />
                    }
                  />
                  <Pie
                    data={savingsPieData}
                    dataKey="amountCents"
                    nameKey="key"
                    innerRadius={52}
                    strokeWidth={2}
                  >
                    {savingsPieData.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Debt rundown</CardTitle>
          <CardDescription>
            Credit cards and loans from the Debt tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projection.debts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No debt amounts to chart.
            </p>
          ) : (
            <ChartContainer
              config={debtConfig}
              className="aspect-auto w-full"
              style={{ height: barHeight(projection.debts.length) }}
            >
              <BarChart
                data={projection.debts}
                layout="vertical"
                margin={{ left: 8, right: 12, top: 8 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatCentsCompact(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={112}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCents(Number(value ?? 0))}
                    />
                  }
                />
                <Bar
                  dataKey="amountCents"
                  name="amountCents"
                  fill="var(--color-amountCents)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      </section>

      <div className="xl:col-span-2">
        <DebtMinimumPayoffChart projection={projection} />
      </div>
    </div>
  );
}

function DebtMinimumPayoffChart({
  projection,
}: {
  projection: RunwayProjection;
}) {
  const payoffs = projection.debtPayoffs;
  const withMinimum = payoffs.filter((item) => item.months !== null);
  const monthlyMinimumCents = payoffs.reduce(
    (total, item) => total + item.minimumPaymentCents,
    0
  );
  const longest = withMinimum[0] ?? null;
  const monthBars = withMinimum.map((item) => ({
    name: item.name,
    months: item.months ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minimum payoff</CardTitle>
        <CardDescription>
          How long each balance takes if you only pay the monthly minimum. No
          interest is applied.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Minimums</p>
            <p className="font-heading text-2xl font-medium text-[var(--chart-5)]">
              {formatCents(monthlyMinimumCents)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Debt free</p>
            <p className="font-heading text-2xl font-medium">
              {longest?.months == null
                ? "Add minimums"
                : longest.capped
                  ? "5+ years"
                  : formatPayoffMonths(longest.months)}
            </p>
            <p className="text-xs text-muted-foreground">
              {longest?.payoffLabel
                ? `Last balance clears ${longest.payoffLabel}`
                : "Need a minimum payment on each debt"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Starting debt</p>
            <p className="font-heading text-2xl font-medium">
              {formatCents(projection.debtCents)}
            </p>
          </div>
        </div>

        {projection.debtPayoffPoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add debt amounts and minimum payments to project payoff.
          </p>
        ) : (
          <ChartContainer
            config={debtPayoffConfig}
            className="aspect-auto h-64 w-full"
          >
            <AreaChart
              data={projection.debtPayoffPoints}
              margin={{ left: 8, right: 12, top: 8 }}
            >
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
                tickFormatter={(value: number) => formatCentsCompact(value)}
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
        )}

        {monthBars.length > 0 ? (
          <ChartContainer
            config={debtPayoffConfig}
            className="aspect-auto w-full"
            style={{ height: barHeight(monthBars.length) }}
          >
            <BarChart
              data={monthBars}
              layout="vertical"
              margin={{ left: 8, right: 12, top: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  formatPayoffMonths(Number(value))
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={112}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatPayoffMonths(Number(value ?? 0))}
                  />
                }
              />
              <Bar
                dataKey="months"
                name="months"
                fill="var(--color-months)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
}
