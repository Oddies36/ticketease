import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const ticketId = Number(body.ticketId);
    const newStatusId = typeof body.statusId === "number" ? body.statusId : null;
    const newAssignedToId = body.assignedToId === null || typeof body.assignedToId === "number" ? body.assignedToId : undefined;
    const close = body.close === true;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId manquant" }, { status: 400 });
    }

    const current = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { sla: true, status: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    const openStatus = await prisma.status.findUnique({ where: { label: "Ouvert" } });
    const closedStatus = await prisma.status.findUnique({ where: { label: "Fermé" } });

    const data: any = {};
    data.updateDate = new Date();

    if (typeof newStatusId === "number") {
      data.statusId = newStatusId;
    }

    if (newAssignedToId === null || typeof newAssignedToId === "number") {
      data.assignedToId = newAssignedToId;
    }

    // 1) Stop RESPONSE timer the first time we leave "Ouvert"
    if (openStatus) {
      const wasOpen = current.statusId === openStatus.id;
      const leavesOpen = typeof newStatusId === "number" && newStatusId !== openStatus.id;

      if (wasOpen && leavesOpen && current.responseDate) {
        const now = new Date();
        const deadline = new Date(current.responseDate).getTime();
        const nowTime = now.getTime();

        if (nowTime > deadline) {
          data.isBreached = true; // response SLA breached
        }

        // Clear responseDate to "freeze" the timer in UI
        data.responseDate = null;
      }
    }

    // 2) Stop RESOLUTION timer on close
    if (close) {
      const now = new Date();
      data.closedDate = now;

      if (!data.statusId && closedStatus) {
        data.statusId = closedStatus.id;
      }

      if (current.sla && typeof current.sla.resolutionTime === "number") {
        const base = new Date(current.creationDate).getTime();
        const deadline = base + current.sla.resolutionTime * 60 * 1000;

        if (now.getTime() > deadline) {
          data.isBreached = true; // resolution SLA breached
        }
      }
    }

    const saved = await prisma.ticket.update({
      where: { id: ticketId },
      data: data,
    });

    return NextResponse.json({ ticket: saved });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
