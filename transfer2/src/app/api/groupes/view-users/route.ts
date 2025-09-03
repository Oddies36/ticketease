import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/groupes/view-users?groupId=...
 * Récupère la liste des utilisateurs appartenant à un groupe donné.
 */
export async function GET(req: Request) {
  // Extrait le paramètre groupId depuis l'URL
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  // Vérifie que le paramètre est bien présent
  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
  }

  try {
    // Recherche les enregistrements dans la table groupUser
    // et inclut les informations de l'utilisateur associé
    const users = await prisma.groupUser.findMany({
      where: {
        groupId: parseInt(groupId),
      },
      include: {
        user: true,
      },
    });

    // Formate la réponse : renvoie seulement les champs utiles
    const formattedUsers = users.map((entry) => ({
      id: entry.user.id,
      firstName: entry.user.firstName,
      lastName: entry.user.lastName,
      isAdmin: entry.isAdmin,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
