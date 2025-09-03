import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * DELETE /api/groupes/delete-group
 * Supprime un groupe et ses membres associés,
 * uniquement si l'utilisateur est membre du groupe d'administration "Gestion.Groupes.<location>".
 */
export async function DELETE(req: Request) {
  try {
    // Récupère l'utilisateur connecté
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Lecture du corps de la requête et extraction du groupId
    const body = await req.json().catch(() => null);
    if (!body || typeof body.groupId !== "number") {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }
    const groupId = body.groupId;

    // Vérifie que le groupe ciblé existe et récupère aussi la localisation associée
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

    // Construit le nom du groupe d'administration de la localisation
    const locationAdminGroupName =
      "Gestion.Groupes." + targetGroup.location.name;

    // Recherche le groupe d'administration de la localisation
    const locationAdminGroup = await prisma.group.findFirst({
      where: {
        groupName: locationAdminGroupName,
        locationId: targetGroup.location.id,
      },
      select: { id: true },
    });
    if (!locationAdminGroup) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifie que l'utilisateur courant est membre de ce groupe d'administration
    const locationAdminMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: { userId: me.id, groupId: locationAdminGroup.id },
      },
    });
    if (!locationAdminMembership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Supprime tous les membres du groupe avant suppression du groupe lui-même
    await prisma.groupUser.deleteMany({ where: { groupId } });

    // Supprime le groupe
    await prisma.group.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
