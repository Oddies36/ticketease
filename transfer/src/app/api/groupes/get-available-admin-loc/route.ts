import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/groupes/available-locations?prefix=...
 * Retourne la liste des localisations accessibles pour l'utilisateur connecté,
 * en fonction de son appartenance à des groupes dont le nom commence par prefix.
 * - Si le préfixe est "Gestion.Groupes.", l'utilisateur doit être administrateur du groupe.
 */
export async function GET(req: Request) {
  // Vérifie l'utilisateur connecté
  const me = await getAuthenticatedUser();
  if (!me)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Lecture du paramètre prefix
  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") ?? "";

  // Accès réservé aux admins si préfixe = Gestion.Groupes.
  const adminOnly = prefix.startsWith("Gestion.Groupes.");

  // Récupère les appartenances de l'utilisateur correspondant au préfixe
  const memberships = await prisma.groupUser.findMany({
    where: {
      userId: me.id,
      ...(adminOnly ? { isAdmin: true } : {}),
      group: {
        groupName: { startsWith: prefix },
        location: { isNot: null },
      },
    },
    include: { group: { include: { location: true } } },
  });

  // Extrait les noms de localisations uniques
  const locations = Array.from(
    new Set(
      memberships
        .map((m) => m.group.location?.name)
        .filter((n): n is string => Boolean(n))
    )
  );

  return NextResponse.json({ locations });
}
