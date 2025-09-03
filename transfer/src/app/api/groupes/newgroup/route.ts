import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/groupes/new-group
 * Crée un nouveau groupe si le nom n'est pas déjà utilisé.
 * - Vérifie l'existence d'un groupe avec le même nom
 * - Crée le groupe avec les informations fournies
 * - Ajoute automatiquement le propriétaire comme administrateur du groupe
 *
 * Body attendu :
 * {
 *   groupName: string,
 *   location: number (id de la localisation),
 *   description: string,
 *   owner: number (id de l'utilisateur propriétaire)
 * }
 */
export async function POST(request: Request) {
  const { groupName, location, description, owner } = await request.json();

  try {
    // Vérifie si un groupe avec le même nom existe déjà
    const existingGroup = await prisma.group.findFirst({
      where: {
        groupName: groupName,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        {
          success: false,
          message: "Le groupe existe déjà.",
        },
        {
          status: 409,
        }
      );
    }

    // Création du groupe
    const newGroup = await prisma.group.create({
      data: {
        groupName: groupName,
        locationId: location,
        description: description,
        ownerId: owner,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Ajoute le propriétaire comme administrateur du groupe
    await prisma.groupUser.create({
      data: {
        userId: owner,
        groupId: newGroup.id,
        isAdmin: true,
      },
    });

    return NextResponse.json({ success: true, data: newGroup });
  } catch (error) {
    console.error("Erreur lors de la création du groupe:", error);
    return NextResponse.json([], { status: 500 });
  }
}
