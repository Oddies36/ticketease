// src/app/api/incidents/statuses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const statuses = await prisma.status.findMany({
      select: { id: true, label: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ statuses });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
