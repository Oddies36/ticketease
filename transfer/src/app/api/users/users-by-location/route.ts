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

    const guardGroupName = "Gestion.Utilisateurs." + location.name;

    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: location.id },
      select: { id: true },
    });

    if (!guardGroup) {
      return NextResponse.json({ users: [] });
    }

    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json({ users: [] });
    }

    const usersInLocation = await prisma.user.findMany({
      where: { locationId: location.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        emailProfessional: true,
        isAdmin: true,
        mustChangePassword: true,
        managerId: true,
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json({ users: usersInLocation });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
