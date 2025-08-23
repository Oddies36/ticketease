import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  //On récupère l'utilisateur à partir du cookie JWT
  const user = await getAuthenticatedUser();

  //S'il n'y a pas de user, on retourne une erreur 401
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  //Sinon on renvoi le user et des attributs
  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailProfessional: user.emailProfessional,
    isAdmin: user.isAdmin,
    mustChangePassword: user.mustChangePassword,
  });
}