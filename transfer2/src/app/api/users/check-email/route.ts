import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/check-email?email=...
 * Vérifie si une adresse email professionnelle est déjà utilisée par un utilisateur.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Pas de mail donné" }, { status: 400 });
  }

  // Recherche de l'utilisateur par email
  const user = await prisma.user.findUnique({
    where: {
      emailProfessional: email,
    },
  });
  return NextResponse.json({ exists: !!user });
}
