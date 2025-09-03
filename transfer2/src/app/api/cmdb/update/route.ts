import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/cmdb/computers/update
 * Met à jour un ordinateur
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    // Champs reçus
    const idRaw = body.id;
    const computerNameRaw = body.computerName;
    const assignedToIdRaw = body.assignedToId;

    // Vérifie l'id
    if (idRaw === undefined || idRaw === null) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }
    const id = Number(idRaw);
    if (isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    // Vérifie le nom d'ordinateur
    const computerName =
      typeof computerNameRaw === "string" ? computerNameRaw.trim() : "";
    if (!computerName) {
      return NextResponse.json(
        { error: "Nom de l'ordinateur requis" },
        { status: 400 }
      );
    }

    // Vérifie l'utilisateur assigné
    let assignedToId: number | null = null;
    if (
      assignedToIdRaw !== null &&
      assignedToIdRaw !== "" &&
      assignedToIdRaw !== undefined
    ) {
      const v = Number(assignedToIdRaw);
      if (isNaN(v)) {
        return NextResponse.json(
          { error: "assignedToId invalide" },
          { status: 400 }
        );
      }
      const user = await prisma.user.findUnique({
        where: { id: v },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 400 }
        );
      }
      assignedToId = v;
    } else {
      assignedToId = null;
    }

    // Mise à jour dans la DB
    const updated = await prisma.computer.update({
      where: { id: id },
      data: {
        computerName: computerName,
        assignedToId: assignedToId,
        assignedAt: assignedToId ? new Date() : null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ computer: updated });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
