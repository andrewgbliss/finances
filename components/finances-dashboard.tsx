"use client";

import { ChartColumn, Table2 } from "lucide-react";
import { FinanceCharts } from "@/components/finance-charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCents } from "@/lib/money";
import { formatPayoffMonths, type RunwayProjection } from "@/lib/runway";
import type { FinanceWorkbook } from "@/lib/sheet-finance";

export type DashboardTotals = {
  expenseTotal: number;
  incomeTotal: number;
  savingsTotal: number;
  debtTotal: number;
};

export function FinancesDashboard({
  workbook,
  projection,
  totals,
}: {
  workbook: FinanceWorkbook;
  projection: RunwayProjection;
  totals: DashboardTotals;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Expenses"
          value={formatCents(totals.expenseTotal)}
          hint="Monthly from the sheet"
          accent="var(--chart-3)"
        />
        <KpiCard
          label="Income"
          value={formatCents(totals.incomeTotal)}
          hint="Monthly gross"
          accent="var(--chart-1)"
        />
        <KpiCard
          label="Savings"
          value={formatCents(totals.savingsTotal)}
          hint="Cash and investments"
          accent="var(--chart-2)"
        />
        <KpiCard
          label="Debt"
          value={formatCents(totals.debtTotal)}
          hint="Balances owed"
          accent="var(--chart-5)"
        />
      </section>

      <Tabs defaultValue="charts" className="gap-4">
        <TabsList className="h-9">
          <TabsTrigger value="charts" className="px-3">
            <ChartColumn data-icon="inline-start" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="tables" className="px-3">
            <Table2 data-icon="inline-start" />
            Tables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <FinanceCharts projection={projection} />
        </TabsContent>

        <TabsContent value="tables">
          <div className="grid gap-4 xl:grid-cols-2">
            <TableCard
              title="Expenses"
              description="Name and cost from the sheet."
              columns={["Name", "Cost"]}
              empty="No expenses in this sheet."
              rows={workbook.expenses.map((row) => [
                row.name,
                formatCents(row.costCents),
              ])}
            />
            <TableCard
              title="Income"
              description="Monthly gross from the Income tab."
              columns={["Name", "Amount"]}
              empty="No income in this sheet."
              rows={workbook.income.map((row) => [
                row.name,
                formatCents(row.amountCents),
              ])}
            />
            <TableCard
              title="Savings"
              description="Retirement, Checking, Savings, Money Market, Growth Cert, or Stocks."
              columns={["Name", "Type", "Amount"]}
              empty="No savings in this sheet."
              rows={workbook.savings.map((row) => [
                row.name,
                row.type,
                formatCents(row.amountCents),
              ])}
            />
            <TableCard
              title="Debt"
              description="Credit cards and loans, with monthly minimums."
              columns={["Name", "Type", "Amount", "Minimum", "Paid off"]}
              empty="No debt in this sheet."
              rows={workbook.debt.map((row) => {
                const months =
                  row.amountCents > 0 && row.minimumPaymentCents > 0
                    ? Math.ceil(row.amountCents / row.minimumPaymentCents)
                    : null;
                return [
                  row.name,
                  row.type,
                  formatCents(row.amountCents),
                  formatCents(row.minimumPaymentCents),
                  months === null
                    ? row.amountCents <= 0
                      ? "Paid off"
                      : "Add a minimum"
                    : formatPayoffMonths(months),
                ];
              })}
            />
            <TableCard
              title="Actions"
              description="Named follow-ups from the Actions tab."
              columns={["Name"]}
              empty="No actions in this sheet."
              rows={workbook.actions.map((row) => [row.name])}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <CardHeader className="pt-4 pb-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-2xl">{value}</CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
    </Card>
  );
}

function TableCard({
  title,
  description,
  columns,
  rows,
  empty,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ReadOnlyTable columns={columns} empty={empty} rows={rows} />
      </CardContent>
    </Card>
  );
}

function ReadOnlyTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              className={column !== "Name" && column !== "Type" ? "text-right" : undefined}
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`${row[0]}-${index}`}>
            {row.map((value, cellIndex) => (
              <TableCell
                key={`${columns[cellIndex]}-${cellIndex}`}
                className={
                  columns[cellIndex] !== "Name" && columns[cellIndex] !== "Type"
                    ? "text-right"
                    : undefined
                }
              >
                {value}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
