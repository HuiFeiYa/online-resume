import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  username: string;
  role: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getCurrentUser();
  if (!session) return null;
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.uid))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}