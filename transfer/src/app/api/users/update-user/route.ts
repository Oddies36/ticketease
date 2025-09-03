import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * PATCH /api/users/update-user
 * Met à jour certaines propriétés d'un utilisateur
 */
export async function PATCH(req: Request) {
  try {
    // Vérifie l'utilisateur authentifié
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json(
        { success: false, message: "Non authentifié" },
        { status: 401 }
      );
    }

    // Parse du body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const userId = body.userId;
    const isAdmin = body.isAdmin;
    const mustChangePassword = body.mustChangePassword;
    const managerId = body.managerId;

    if (typeof userId !== "number") {
      return NextResponse.json(
        { success: false, message: "Paramètres invalides" },
        { status: 400 }
      );
    }

    // Récupère l'utilisateur cible + sa localisation
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!targetUser || !targetUser.location) {
      return NextResponse.json(
        { success: false, message: "Utilisateur ou localisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifie que le groupe de garde "Gestion.Utilisateurs.<location>" existe
    const guardGroupName = "Gestion.Utilisateurs." + targetUser.location.name;
    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: targetUser.location.id },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Vérifie que l'utilisateur courant est membre du groupe de garde
    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Prépare les champs à mettre à jour
    const dataToUpdate: any = {};

    if (typeof isAdmin === "boolean") {
      dataToUpdate.isAdmin = isAdmin;
    }
    if (typeof mustChangePassword === "boolean") {
      dataToUpdate.mustChangePassword = mustChangePassword;
    }
    if (typeof managerId === "number" || managerId === null) {
      dataToUpdate.managerId = managerId;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucun champ à mettre à jour" },
        { status: 400 }
      );
    }

    // Met à jour l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
