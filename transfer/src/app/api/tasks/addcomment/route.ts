import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * POST /api/tasks/addcomment
 * Ajoute un commentaire à une tâche.
 */
export async function POST(request: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ticketId = body.ticketId;
    const content = body.content || "";

    // Vérification des paramètres obligatoires
    if (!ticketId || !content) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Vérifie que le ticket existe et est bien une tâche
    const task = await prisma.ticket.findUnique({
      where: { id: Number(ticketId) },
      select: { id: true, type: true },
    });
    if (!task || task.type !== "task") {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 }
      );
    }

    // Création du commentaire
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
