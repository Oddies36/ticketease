import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const idRaw = body.id;
    const computerNameRaw = body.computerName;
    const assignedToIdRaw = body.assignedToId;

    if (idRaw === undefined || idRaw === null) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }
    const id = Number(idRaw);
    if (isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const computerName =
      typeof computerNameRaw === "string" ? computerNameRaw.trim() : "";
    if (!computerName) {
      return NextResponse.json(
        { error: "Nom de l'ordinateur requis" },
        { status: 400 }
      );
    }

    let assignedToId: number | null = null;
    if (assignedToIdRaw !== null && assignedToIdRaw !== "" && assignedToIdRaw !== undefined) {
      const v = Number(assignedToIdRaw);
      if (isNaN(v)) {
        return NextResponse.json({ error: "assignedToId invalide" }, { status: 400 });
      }
      const user = await prisma.user.findUnique({
        where: { id: v },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 400 });
      }
      assignedToId = v;
    } else {
      assignedToId = null;
    }

    const updated = await prisma.computer.update({
      where: { id: id },
      data: {
        computerName: computerName,
        assignedToId: assignedToId,
        // Si tu veux aussi gérer assignedAt ici :
        assignedAt: assignedToId ? new Date() : null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ computer: updated });
  } catch (e) {
    console.error("Erreur PATCH /api/cmdb/update:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
