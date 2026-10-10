"use client";

import { selectSpreadsheet } from "@/app/actions/sheets";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { SpreadsheetOption } from "@/lib/google-sheets";

export function SheetPicker({
  sheets,
  selectedId,
}: {
  sheets: SpreadsheetOption[];
  selectedId: string | null;
}) {
  return (
    <form action={selectSpreadsheet} className="flex w-full max-w-xl flex-col gap-2 lg:items-end">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="spreadsheetId" className="text-sm text-muted-foreground">
          Google Sheet
        </label>
        <NativeSelect
          id="spreadsheetId"
          name="spreadsheetId"
          className="w-full sm:min-w-72"
          defaultValue={selectedId ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <NativeSelectOption value="">
            {sheets.length === 0 ? "No sheets found" : "Select a sheet"}
          </NativeSelectOption>
          {sheets.map((sheet) => (
            <NativeSelectOption key={sheet.id} value={sheet.id}>
              {sheet.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {sheets.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No Google Sheets were returned for this account. Sign in with the
          account that owns the sheet, or paste a URL the signed-in account can
          open.
        </p>
      ) : null}
      <div className="flex gap-2">
        <input
          name="spreadsheetUrl"
          placeholder="Or paste a Google Sheet URL"
          aria-label="Google Sheet URL"
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" variant="outline">
          Load
        </Button>
      </div>
    </form>
  );
}
