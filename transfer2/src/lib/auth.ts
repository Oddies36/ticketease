import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function getAuthenticatedUser() {
  //On lit le cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;

  try {
    //On vérifie le token et on récupère l'id
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    //On recharge l'utilisateur complet depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    //Si la signature est invalide ou le token a expiré -> non authentifié.
    return user ?? null;
  } catch {
    return null;
  }
}
