import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tasks/get?id=...
 * Récupère les détails d'une tâche par son ID.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // Vérifie que le paramètre id est bien présent
  if (!id) {
    return NextResponse.json(
      { error: "Paramètre 'id' manquant" },
      { status: 400 }
    );
  }

  try {
    // Recherche de la tâche avec relations associées
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
        createdBy: true,
        comments: {
          orderBy: { createdAt: "desc" },
          include: { createdBy: true },
        },
      },
    });

    // Vérifie que l'élément est bien une tâche
    if (!task || task.type !== "task") {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
