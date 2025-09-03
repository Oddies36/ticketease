import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Déconnecté" });

  //On écrase le cookie pour l'expirer.
  res.headers.set(
    "Set-Cookie",
    "accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;"
  );
  return res;
}
