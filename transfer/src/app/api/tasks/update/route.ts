import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ticketId = body.ticketId;
    const statusId = body.statusId;
    const assignedToId = body.assignedToId;
    const close = body.close === true;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId manquant" }, { status: 400 });
    }

    const current = await prisma.ticket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        status: true,
      },
    });

    if (!current || current.type !== "task") {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const data: any = {};
    data.updateDate = new Date();
    data.updatedById = me.id;

    if (typeof assignedToId === "number") {
      data.assignedToId = assignedToId;
    } else if (assignedToId === null) {
      data.assignedToId = null;
    }

    if (close) {
      data.closedDate = new Date();
    }

    if (typeof statusId === "number") {
      data.statusId = statusId;
    }

    const updated = await prisma.ticket.update({
      where: { id: Number(ticketId) },
      data: data,
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
