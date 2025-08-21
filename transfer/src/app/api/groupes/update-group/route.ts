import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const groupId = body.groupId;
    const description = body.description;
    const ownerId = body.ownerId;

    if (typeof groupId !== "number" || typeof ownerId !== "number") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

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

    await prisma.group.update({
      where: { id: groupId },
      data: {
        description: description === null || description === undefined ? null : String(description),
        ownerId: ownerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}