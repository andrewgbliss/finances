import { jwtVerify, SignJWT } from "jose";
import type { SessionPayload } from "@/lib/definitions";

export const AUTH_COOKIE_NAME = "auth-token";
export const OAUTH_STATE_COOKIE = "oauth-state";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(getSecret());
}

export async function decryptSession(
  token: string | undefined
): Promise<{ userId: number } | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const userId = Number(payload.userId);
    if (!Number.isFinite(userId)) {
      return null;
    }
    return { userId };
  } catch {
    return null;
  }
}
