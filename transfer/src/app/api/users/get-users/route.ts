import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/get-users
 * Récupère la liste des utilisateurs avec leurs informations principales.
 */
export async function GET() {
  try {
    // Recherche les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        emailProfessional: true,
        isAdmin: true,
        mustChangePassword: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs.",
    });
  }
}
