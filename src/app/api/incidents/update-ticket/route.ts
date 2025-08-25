import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();


    const ticketId = Number(body.ticketId);
    const newStatusId = body.statusId;
    const newAssignedToId =
      body.assignedToId === null || typeof body.assignedToId === "number"
        ? (body.assignedToId as number | null)
        : undefined;
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

    const openStatus = await prisma.status.findUnique({
      where: { label: "Ouvert" },
    });
    const closedStatus = await prisma.status.findUnique({
      where: { label: "Fermé" },
    });

    // -------------------------
    // Variables (start with current values)
    // -------------------------
    let updateDate: Date = new Date();
    let statusId: number = current.statusId;
    let assignedToId: number | null = current.assignedToId;
    let closedDate: Date | null = current.closedDate;
    let isBreached: boolean = !!current.isBreached;
    let responseDate: Date | null = current.responseDate;

    // Apply direct inputs
    if (typeof newStatusId === "number") {
      statusId = newStatusId;
    }
    if (newAssignedToId === null || typeof newAssignedToId === "number") {
      assignedToId = newAssignedToId ?? null; // keep explicit null when unassigning
    }

    // 1) Stop RESPONSE timer the first time we leave "Ouvert"
    if (openStatus) {
      const wasOpen = current.statusId === openStatus.id;
      const leavesOpen =
        typeof newStatusId === "number" && newStatusId !== openStatus.id;

      if (wasOpen && leavesOpen && current.responseDate) {
        const now = Date.now();
        const deadline = new Date(current.responseDate).getTime();

        if (now > deadline) {
          isBreached = true; // response SLA breached
        }

        // Freeze response timer
        responseDate = null;
      }
    }

    // 2) Stop RESOLUTION timer on close
    if (close) {
      const now = new Date();
      closedDate = now;

      // If no explicit status provided, set to "Fermé"
      if (typeof newStatusId !== "number" && closedStatus) {
        statusId = closedStatus.id;
      }

      if (current.sla && typeof current.sla.resolutionTime === "number") {
        const base = new Date(current.creationDate).getTime();
        const deadline = base + current.sla.resolutionTime * 60 * 1000;
        if (now.getTime() > deadline) {
          isBreached = true; // resolution SLA breached
        }
      }
    }

    // -------------------------
    // Single explicit update
    // -------------------------
    const saved = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updateDate,
        statusId,
        assignedToId,   // number or null
        closedDate,     // Date or null
        isBreached,
        responseDate,   // Date or null
      },
    });

    return NextResponse.json({ ticket: saved });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
