import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { json } from "stream/consumers";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  // Vérifie si un utilisateur est authentifié
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Pas d'utilisateur trouvé" },
      { status: 401 }
    );
  }

  // Récupère le mot de passe depuis le body JSON
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json(
      { error: "Pas de mot de passe trouvé" },
      { status: 401 }
    );
  }

  // Hash du mot de passe avec bcrypt (10 salt rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Met à jour l'utilisateur dans la DB :
    // - nouveau mot de passe hashé
    // - désactive le flag "mustChangePassword"
    // - met à jour la date de modification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        updatedAt: new Date(),
      },
    });

    // Succès
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Erreur lors du changement du mot de passe.",
    });
  }
}
