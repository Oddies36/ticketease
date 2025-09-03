import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/groupes/view-user-groups?userId=...
 * Retourne les groupes d'un utilisateur donné :
 * - adminGroups : groupes où l'utilisateur est administrateur
 * - memberGroups : tous les groupes dont il est membre (y compris admin)
 */
export async function GET(request: Request) {
  // Récupère le paramètre userId
  const userId = parseInt(
    new URL(request.url).searchParams.get("userId") || ""
  );

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Récupère toutes les appartenances de l'utilisateur
  const groupMemberships = await prisma.groupUser.findMany({
    where: { userId },
    include: {
      group: true,
    },
  });

  // Sépare les groupes où l'utilisateur est admin
  const adminGroups = groupMemberships
    .filter((membership) => membership.isAdmin)
    .map((membership) => membership.group);

  // Liste complète des groupes
  const memberGroups = groupMemberships.map((membership) => membership.group);

  return NextResponse.json({
    adminGroups,
    memberGroups,
  });
}
