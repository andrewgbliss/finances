import { requireCurrentUser } from "@/app/actions/auth";
import {
  getSelectedWorkbook,
  getSpreadsheetOptions,
} from "@/app/actions/sheets";
import { FinancesBoard } from "@/components/finances-board";
import { SheetPicker } from "@/components/sheet-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function FinancesPage() {
  const user = await requireCurrentUser();

  let sheetsError: string | null = null;
  let sheets: Awaited<ReturnType<typeof getSpreadsheetOptions>> = [];
  let workbook: Awaited<ReturnType<typeof getSelectedWorkbook>> = null;

  const results = await Promise.allSettled([
    getSpreadsheetOptions(),
    getSelectedWorkbook(),
  ]);

  if (results[0].status === "fulfilled") {
    sheets = results[0].value;
  } else {
    sheetsError =
      results[0].reason instanceof Error
        ? results[0].reason.message
        : "Could not list Google Sheets.";
  }

  if (results[1].status === "fulfilled") {
    workbook = results[1].value;
  } else {
    const readError =
      results[1].reason instanceof Error
        ? results[1].reason.message
        : "Could not read the selected Google Sheet.";
    sheetsError = sheetsError ? `${sheetsError} ${readError}` : readError;
  }

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Dashboard
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Finances
          </h1>
        </div>
        <SheetPicker sheets={sheets} selectedId={user.selectedSpreadsheetId} />
      </div>
      {sheetsError ? (
        <p className="mb-4 text-sm text-destructive">
          {sheetsError}{" "}
          <Link href="/api/auth/google" className={cn(buttonVariants({ variant: "link" }))}>
            Reconnect Google
          </Link>
        </p>
      ) : null}
      <FinancesBoard workbook={workbook} />
    </div>
  );
}
