import { requireCurrentUser } from "@/app/actions/auth";
import { getSpreadsheetOptions } from "@/app/actions/sheets";
import { LogoutButton } from "@/components/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  let selectedName = "None selected";

  try {
    const sheets = await getSpreadsheetOptions();
    selectedName =
      sheets.find((sheet) => sheet.id === user.selectedSpreadsheetId)?.name ??
      (user.selectedSpreadsheetId ? "Selected sheet" : "None selected");
  } catch {
    selectedName = user.selectedSpreadsheetId
      ? "Selected sheet"
      : "None selected";
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Signed in with Google. Tokens stay on the server. Email and password
            are not stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Google connection</p>
            <p className="text-sm">Connected</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Selected sheet</p>
            <p className="text-sm">{selectedName}</p>
          </div>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
