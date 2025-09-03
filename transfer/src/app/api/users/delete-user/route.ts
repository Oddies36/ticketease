import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * DELETE /api/users/delete-user?id=...
 * Supprime un utilisateur si l'appelant appartient au groupe de gestion correspondant.
 */
export async function DELETE(request: Request) {
  try {
    // Vérifie l'utilisateur authentifié
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json(
        { success: false, message: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupère l'ID utilisateur depuis l'URL
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("id");

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, message: "ID de l'utilisateur manquant." },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);

    // Vérifie que l'utilisateur existe et qu'il est lié à une localisation
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!targetUser || !targetUser.location) {
      return NextResponse.json(
        { success: false, message: "Utilisateur ou localisation introuvable." },
        { status: 404 }
      );
    }

    // Vérifie que l'appelant fait partie du groupe de gestion correspondant
    const guardGroupName = "Gestion.Utilisateurs." + targetUser.location.name;

    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: targetUser.location.id },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json(
        { success: false, message: "Accès refusé." },
        { status: 403 }
      );
    }

    // Vérifie que l'appelant est bien membre du groupe de gestion
    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json(
        { success: false, message: "Accès refusé." },
        { status: 403 }
      );
    }

    // Désassigne tous les ordinateurs qui pointent vers cet utilisateur
    await prisma.computer.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null, assignedAt: null },
    });

    // Supprime l'utilisateur. Grâce au schéma Prisma,
    // les tickets, commentaires et ordinateurs assignés ne seront pas supprimés.
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    if (!deletedUser) {
      return NextResponse.json({
        success: false,
        message: "Utilisateur non trouvé.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la suppression de l'utilisateur.",
      },
      { status: 500 }
    );
  }
}
