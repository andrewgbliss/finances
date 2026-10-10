import "server-only";

import { cookies } from "next/headers";
import { OAUTH_STATE_COOKIE } from "@/lib/session-token";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
] as const;

export type GoogleTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: number;
  googleSub: string;
};

function requireEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export async function createOAuthState(): Promise<string> {
  const state = crypto.randomUUID();
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return state;
}

export async function consumeOAuthState(state: string | null): Promise<boolean> {
  if (!state) {
    return false;
  }
  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);
  return Boolean(expected) && expected === state;
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "select_account consent",
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function decodeIdTokenSub(idToken: string): string {
  const payload = idToken.split(".")[1];
  if (!payload) {
    throw new Error("Google id_token is missing");
  }
  const json = Buffer.from(payload, "base64url").toString("utf8");
  const parsed = JSON.parse(json) as { sub?: string };
  if (!parsed.sub) {
    throw new Error("Google id_token is missing sub");
  }
  return parsed.sub;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenSet> {
  const body = new URLSearchParams({
    code,
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Google token exchange failed");
  }

  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
  };

  if (!json.access_token || !json.id_token) {
    throw new Error("Google token response was incomplete");
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    accessTokenExpiresAt:
      Math.floor(Date.now() / 1000) + (json.expires_in ?? 3600),
    googleSub: decodeIdTokenSub(json.id_token),
  };
}

export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<Omit<GoogleTokenSet, "googleSub">> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Google token refresh failed");
  }

  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    throw new Error("Google refresh response was incomplete");
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    accessTokenExpiresAt:
      Math.floor(Date.now() / 1000) + (json.expires_in ?? 3600),
  };
}
