import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const locationName = url.searchParams.get("location");

    if (!locationName) {
      return NextResponse.json({ error: "Paramètre 'location' manquant" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({
      where: { name: locationName },
    });

    if (!location) {
      return NextResponse.json({ error: "Localisation inconnue" }, { status: 404 });
    }

    // Guard group name
    const guardGroupName = "Gestion.Groupes." + location.name;

    // Find the guard group in this location
    const guardGroup = await prisma.group.findFirst({
      where: {
        groupName: guardGroupName,
        locationId: location.id,
      },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json({ groups: [] });
    }

    // Check if it's memeber or admin
    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json({ groups: [] });
    }

    // User is allowed. Return all groups in this location.
    const groups = await prisma.group.findMany({
      where: { locationId: location.id },
      select: {
        id: true,
        groupName: true,
        description: true,
        locationId: true,
        ownerId: true,
      },
      orderBy: { groupName: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}