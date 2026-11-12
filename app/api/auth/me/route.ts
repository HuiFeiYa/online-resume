import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}