import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isVipActive } from "@/lib/quota";

export type SessionUser = {
  id: string;
  username: string;
  role: string;
  isVip: boolean;
  vipExpiresAt: number | null;
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
      isVip: schema.users.isVip,
      vipExpiresAt: schema.users.vipExpiresAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.uid))
    .limit(1);
  const user = rows[0];
  if (!user) return null;
  return { ...user, isVip: isVipActive(user) };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}