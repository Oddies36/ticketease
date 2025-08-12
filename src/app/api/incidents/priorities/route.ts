import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const priorities = await prisma.priority.findMany({
      select: { id: true, label: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ priorities });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}