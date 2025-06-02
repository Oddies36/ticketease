import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.headers.set(
    "Set-Cookie",
    "accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;"
  );
  return res;
}