import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.groupId !== "number") {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const groupId = body.groupId;

    const targetGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: { location: true },
    });

    if (!targetGroup || !targetGroup.location) {
      return NextResponse.json({ error: "Groupe ou localisation introuvable" }, { status: 404 });
    }

    const guardGroupName = "Gestion.Groupes." + targetGroup.location.name;

    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: targetGroup.location.id },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.groupUser.deleteMany({ where: { groupId } });
    await prisma.group.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}