import { NextResponse } from "next/server";
import { consumeOAuthState, exchangeGoogleCode } from "@/lib/google-oauth";
import { createSession } from "@/lib/session";
import { upsertGoogleUser } from "@/src/db/repositories/users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL("/login?error=denied", request.url));
  }

  const stateMatches = await consumeOAuthState(state);
  if (!code || !stateMatches) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const user = await upsertGoogleUser(tokens);
    await createSession(user.id);
    return NextResponse.redirect(new URL("/finances", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }
}
