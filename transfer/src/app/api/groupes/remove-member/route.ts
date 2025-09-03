import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * POST /api/groupes/remove-member
 * Supprime un membre d'un groupe.
 */
export async function POST(req: Request) {
  // Vérifie que l'utilisateur est bien connecté
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // Lecture et validation des paramètres reçus
    const { groupId, userId } = await req.json();
    const gId = Number(groupId);
    const uId = Number(userId);

    if (!gId || !uId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Vérifie que le groupe existe et récupère son propriétaire
    const group = await prisma.group.findUnique({
      where: { id: gId },
      select: { ownerId: true },
    });
    if (!group) {
      return NextResponse.json(
        { error: "Groupe introuvable" },
        { status: 404 }
      );
    }

    // Vérifie si l'appelant est admin du groupe
    const myMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: gId } },
      select: { isAdmin: true },
    });

    const isCallerAdmin = group.ownerId === me.id || !!myMembership?.isAdmin;
    if (!isCallerAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifie que la cible à retirer est bien membre du groupe
    const targetMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: uId, groupId: gId } },
      select: { isAdmin: true },
    });
    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    // Si le membre est admin, on empêche de retirer le dernier admin du groupe
    if (targetMembership.isAdmin) {
      const adminCount = await prisma.groupUser.count({
        where: { groupId: gId, isAdmin: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Impossible de retirer le dernier admin du groupe." },
          { status: 400 }
        );
      }
    }

    // Supprime le membre du groupe
    await prisma.groupUser.delete({
      where: { userId_groupId: { userId: uId, groupId: gId } },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
