import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * Vérifie si l'utilisateur courant est membre d'un groupe Support.*
 * @returns {Promise<{id:number, firstName:string, lastName:string}>} - l'utilisateur si autorisé
 * @throws {Error} si non authentifié ou non autorisé
 */
export async function requireSupportUser() {
  const me = await getAuthenticatedUser();
  if (!me) {
    throw new Error("Pas authentifié");
  }

  const memberships = await prisma.groupUser.findMany({
    where: { userId: me.id },
    include: { group: true },
  });

  const supportMembership = memberships.find((m) =>
    m.group.groupName.startsWith("Support.")
  );

  if (!supportMembership) {
    throw new Error("Accès refusé");
  }

  return me;
}
