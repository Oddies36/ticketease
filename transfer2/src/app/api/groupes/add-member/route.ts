import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/groupes/add-member
 * Ajoute un utilisateur à un groupe (ou met à jour son rôle admin si déjà membre).
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { groupId, userId, isAdmin } = body;

  // Vérifie les champs requis
  if (!groupId || !userId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    // Vérifie si l'utilisateur est déjà membre du groupe
    const existing = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (existing) {
      // Déjà membre → met juste à jour son statut admin
      const updated = await prisma.groupUser.update({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        data: {
          isAdmin,
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json({
        id: updated.user.id,
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
        isAdmin: updated.isAdmin,
      });
    } else {
      // crée une ligne dans groupUser
      const created = await prisma.groupUser.create({
        data: {
          userId,
          groupId,
          isAdmin,
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json({
        id: created.user.id,
        firstName: created.user.firstName,
        lastName: created.user.lastName,
        isAdmin: created.isAdmin,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
