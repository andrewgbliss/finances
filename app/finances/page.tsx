import { FinancesBoard } from "@/components/finances-board";

export default function FinancesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Finances</h1>
        <p className="text-sm text-muted-foreground">
          Edit savings, credit cards, budget, income, and the spreadsheet. Data stays
          in this browser. Changes save when you leave a field.
        </p>
      </div>
      <FinancesBoard />
    </div>
  );
}
