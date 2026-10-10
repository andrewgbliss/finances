import "server-only";

import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  decryptSession,
  encryptSession,
} from "@/lib/session-token";

const SESSION_DAYS = 7;

export async function createSession(userId: number): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await encryptSession({
    userId: String(userId),
    expiresAt,
  });
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

export async function getSession(): Promise<{ userId: number } | null> {
  const store = await cookies();
  return decryptSession(store.get(AUTH_COOKIE_NAME)?.value);
}
