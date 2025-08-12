import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("id");

    if (!userIdParam) {
      return NextResponse.json({ success: false, message: "ID de l'utilisateur manquant." }, { status: 400 });
    }

    const userId = Number(userIdParam);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!targetUser || !targetUser.location) {
      return NextResponse.json({ success: false, message: "Utilisateur ou localisation introuvable." }, { status: 404 });
    }

    const guardGroupName = "Gestion.Utilisateurs." + targetUser.location.name;

    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: targetUser.location.id },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json({ success: false, message: "Accès refusé." }, { status: 403 });
    }

    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json({ success: false, message: "Accès refusé." }, { status: 403 });
    }

    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    if (!deletedUser) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé." });
    }

    return NextResponse.json({ success: true, message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression de l'utilisateur." }, { status: 500 });
  }
}