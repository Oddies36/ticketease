// src/app/api/incidents/get-ticket/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;
    if (isNaN(id)) {
      return NextResponse.json({ error: "Paramètre id invalide" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        status: true,
        priority: true,
        category: true,
        assignmentGroup: true,
        location: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    // Guard: must be in Support.Incidents.<ticket.location> or site admin or ticket owner
    let allowed = false;
    if (me.isAdmin || ticket.createdById === me.id) {
      allowed = true;
    } else {
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId: me.id,
          group: {
            groupName: { startsWith: "Support.Incidents." },
            locationId: ticket.locationId,
          },
        },
      });
      if (membership) allowed = true;
    }

    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
