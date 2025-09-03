import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Rôle :
 *   Retourne une liste avec des noms de localisations auxquelles l'utilisateur connecté
 *   a accès via ses groupes dont le nom commence par un prefix.
 *
 * Paramètres url :
 *   - prefix : string
 *
 * Sécurité :
 *   - Requiert un utilisateur authentifié. Si pas, renvoie une erreur 401.
 *
 * Retour :
 *   - 200 : { locations: string[] } - noms de localisations
 *   - 401 : { error: "Non authentifié" }
 */
export async function GET(req: NextRequest) {
  // Authentification - on refuse si l'utilisateur n'est pas connecté
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Lecture du paramètre nommé prefix
  const searchParams = req.nextUrl.searchParams;
  const prefix = searchParams.get("prefix") ?? "";

  /**
   * Récupération des appartenances aux groupes correspondant au préfixe,
   * en ne gardant que les groupes rattachés à une localisation.
   */
  const groups = await prisma.groupUser.findMany({
    where: {
      userId: user.id,
      group: {
        groupName: { startsWith: prefix },
        location: { isNot: null },
      },
    },
    select: {
      group: {
        select: {
          groupName: true,
          location: { select: { name: true } },
        },
      },
    },
  });

  // Construit l'array
  const locations: string[] = [];

  for (const membership of groups) {
    const name = membership.group?.location?.name;
    if (name && !locations.includes(name)) {
      locations.push(name);
    }
  }

  // Réponse JSON : liste des localisations accessibles.
  return NextResponse.json({ locations });
}
