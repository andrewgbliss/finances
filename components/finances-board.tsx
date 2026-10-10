import { FinancesDashboard } from "@/components/finances-dashboard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { monthlyExpenseRows, buildWorkbookRunway } from "@/lib/runway";
import type { FinanceWorkbook } from "@/lib/sheet-finance";

function sumCents(rows: Array<{ amountCents?: number; costCents?: number }>): number {
  return rows.reduce((total, row) => {
    if ("amountCents" in row && typeof row.amountCents === "number") {
      return total + row.amountCents;
    }
    if ("costCents" in row && typeof row.costCents === "number") {
      return total + row.costCents;
    }
    return total;
  }, 0);
}

export function FinancesBoard({ workbook }: { workbook: FinanceWorkbook | null }) {
  if (!workbook) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Choose a Google Sheet</EmptyTitle>
          <EmptyDescription>
            Pick a spreadsheet with Expenses, Savings, Income, Debt, and Actions
            tabs. Ledger only reads it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const expenseTotal =
    (workbook.expenseFinalTotalCents ?? 0) > 0
      ? workbook.expenseFinalTotalCents
      : monthlyExpenseRows(workbook).reduce(
          (total, row) => total + row.costCents,
          0
        );

  return (
    <FinancesDashboard
      workbook={workbook}
      projection={buildWorkbookRunway(workbook)}
      totals={{
        expenseTotal,
        incomeTotal: sumCents(workbook.income),
        savingsTotal: sumCents(workbook.savings),
        debtTotal: sumCents(workbook.debt),
      }}
    />
  );
}
