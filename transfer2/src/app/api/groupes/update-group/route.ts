import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * PATCH /api/groupes/update
 * Met à jour un groupe (description et propriétaire).
 */
export async function PATCH(req: Request) {
  try {
    // Vérifie que l'appelant est connecté
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupère et parse le body de la requête
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Extrait les champs utiles
    const groupId = body.groupId;
    const description = body.description;
    const ownerId = body.ownerId;

    // Vérifie que les champs obligatoires sont bien des nombres
    if (typeof groupId !== "number" || typeof ownerId !== "number") {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    // Recherche le groupe cible et sa localisation
    const targetGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: { location: true },
    });

    if (!targetGroup || !targetGroup.location) {
      return NextResponse.json(
        { error: "Groupe ou localisation introuvable" },
        { status: 404 }
      );
    }

    // Construit le nom du groupe de gestion attendu
    const guardGroupName = "Gestion.Groupes." + targetGroup.location.name;

    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: targetGroup.location.id },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifie que l'appelant est bien membre du groupe de gestion
    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Mise à jour du groupe
    await prisma.group.update({
      where: { id: groupId },
      data: {
        description:
          description === null || description === undefined
            ? null
            : String(description),
        ownerId: ownerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
