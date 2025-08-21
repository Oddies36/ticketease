// src/app/api/incidents/add-comment/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Corps manquant" }, { status: 400 });
    }

    const ticketId = Number(body.ticketId);
    const content = String(body.content || "").trim();
    if (isNaN(ticketId) || !content) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, createdById: true, locationId: true },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    // Allow creator, site admin, or Support.Incidents.<location>
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

    await prisma.comment.create({
      data: {
        content: content,
        ticketId: ticket.id,
        createdById: me.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
