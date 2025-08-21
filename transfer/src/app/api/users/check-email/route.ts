import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Pas de mail donné" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: {
      emailProfessional: email,
    },
  });

  return NextResponse.json({ exists: !!user });
}