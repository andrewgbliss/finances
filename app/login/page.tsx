import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { GoogleLoginButton } from "@/components/google-login-button";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";

const errorCopy: Record<string, string> = {
  "oauth-config":
    "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  denied: "Google permission was declined. Sheets access is required.",
  oauth: "Google sign-in failed. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (user) {
    redirect("/finances");
  }

  const { error } = await searchParams;
  const configured = isGoogleOAuthConfigured();
  const message = error ? errorCopy[error] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Continue with Google and grant Sheets access. Ledger stores OAuth tokens
          only — no email or password.
        </p>
      </div>
      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your env file, then
          restart the app.
        </p>
      ) : null}
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <GoogleLoginButton disabled={!configured} />
    </div>
  );
}
