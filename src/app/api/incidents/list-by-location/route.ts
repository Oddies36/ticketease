// src/app/api/incidents/list-by-location/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const url = new URL(req.url);
    const locationName = url.searchParams.get("location") || url.searchParams.get("localisation");

    if (!locationName) {
      return NextResponse.json({ error: "Paramètre location manquant" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({ where: { name: locationName } });
    if (!location) {
      return NextResponse.json({ error: "Localisation inconnue" }, { status: 404 });
    }

    // Guard: user must belong to Support.Incidents.<location>
    const membership = await prisma.groupUser.findFirst({
      where: {
        userId: me.id,
        group: {
          groupName: { startsWith: "Support.Incidents." },
          locationId: location.id,
        },
      },
    });

    if (!membership && !me.isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { type: "incident", locationId: location.id },
      include: {
        status: true,
        priority: true,
        assignmentGroup: true,
      },
      orderBy: { creationDate: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
