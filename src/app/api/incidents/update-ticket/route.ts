// src/app/api/incidents/update-ticket/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Corps manquant" }, { status: 400 });
    }

    const ticketId = Number(body.ticketId);
    const statusId = body.statusId === null ? null : Number(body.statusId);
    const assignedToId = body.assignedToId === null ? null : Number(body.assignedToId);
    const close = Boolean(body.close);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ticketId invalide" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, locationId: true },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    // Guard: must be in Support.Incidents.<location> or site admin
    let allowed = false;
    if (me.isAdmin) {
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

    const data: any = {
      updateDate: new Date(),
      updatedById: me.id,
    };
    if (typeof statusId === "number" && !isNaN(statusId)) {
      data.statusId = statusId;
    }
    if (body.hasOwnProperty("assignedToId")) {
      data.assignedToId = assignedToId; // can be null
    }
    if (close) {
      data.closedDate = new Date();
      data.closedById = me.id;
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
