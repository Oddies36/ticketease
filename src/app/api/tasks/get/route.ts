import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Paramètre 'id' manquant" }, { status: 400 });
  }

  try {
    const task = await prisma.ticket.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        status: true,
        priority: true,
        category: true,
        sla: true,
        location: true,
        assignmentGroup: true,
        assignedTo: true,
        comments: {
          orderBy: { createdAt: "desc" },
          include: { createdBy: true },
        },
      },
    });

    if (!task || task.type !== "task") {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
