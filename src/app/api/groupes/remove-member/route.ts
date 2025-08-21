import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { groupId, userId } = await req.json();
    const gId = Number(groupId);
    const uId = Number(userId);

    if (!gId || !uId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Vérifie que l'appelant est admin (owner ou admin via GroupUser)
    const group = await prisma.group.findUnique({
      where: { id: gId },
      select: { ownerId: true },
    });
    if (!group) {
      return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
    }

    const myMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: gId } },
      select: { isAdmin: true },
    });

    const isCallerAdmin = group.ownerId === me.id || !!myMembership?.isAdmin;
    if (!isCallerAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Trouve le membre à retirer
    const targetMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: uId, groupId: gId } },
      select: { isAdmin: true },
    });
    if (!targetMembership) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    // Empêche de retirer le dernier admin du groupe
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

    await prisma.groupUser.delete({
      where: { userId_groupId: { userId: uId, groupId: gId } },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
