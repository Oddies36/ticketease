import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/groupes/admin-groups-by-location?location=...
 * Retourne la liste des groupes d'une localisation,
 * uniquement si l'utilisateur est membre du groupe de garde "Gestion.Groupes.<location>".
 */
export async function GET(req: Request) {
  try {
    // Vérifie l'authentification
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Lecture du paramètre de localisation
    const url = new URL(req.url);
    const locationName = url.searchParams.get("location");

    if (!locationName) {
      return NextResponse.json(
        { error: "Paramètre 'location' manquant" },
        { status: 400 }
      );
    }

    // Vérifie que la localisation existe
    const location = await prisma.location.findUnique({
      where: { name: locationName },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Localisation inconnue" },
        { status: 404 }
      );
    }

    // Nom du groupe pour l'administration de cette localisation
    const checkGroupName = "Gestion.Groupes." + location.name;

    // Cherche ce groupe
    const guardGroup = await prisma.group.findFirst({
      where: {
        groupName: checkGroupName,
        locationId: location.id,
      },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json({ groups: [] });
    }

    // Vérifie que l'utilisateur courant est membre de ce groupe
    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json({ groups: [] });
    }

    // L'utilisateur est autorisé. On retourne tous les groupes de la localisation
    const groups = await prisma.group.findMany({
      where: { locationId: location.id },
      select: {
        id: true,
        groupName: true,
        description: true,
        locationId: true,
        ownerId: true,
      },
      orderBy: { groupName: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
