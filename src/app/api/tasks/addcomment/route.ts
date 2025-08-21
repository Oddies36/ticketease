import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ticketId = body.ticketId;
    const content = body.content || "";

    if (!ticketId || !content) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const task = await prisma.ticket.findUnique({
      where: { id: Number(ticketId) },
      select: { id: true, type: true },
    });
    if (!task || task.type !== "task") {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    await prisma.comment.create({
      data: {
        content: content,
        ticketId: Number(ticketId),
        createdById: me.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
