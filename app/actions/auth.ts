"use server";

import { redirect } from "next/navigation";
import { getSession, deleteSession } from "@/lib/session";
import { findUserById, type UserRecord } from "@/src/db/repositories/users";

export async function getCurrentUser(): Promise<UserRecord | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return findUserById(session.userId);
}

export async function requireCurrentUser(): Promise<UserRecord> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
