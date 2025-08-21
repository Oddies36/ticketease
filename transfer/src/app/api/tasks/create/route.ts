import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const categorie = String(body.categorie || "").trim();
    const demandePour = body.demandePour ? String(body.demandePour) : null;
    const informationsAdditionnelles = body.informationsAdditionnelles ? String(body.informationsAdditionnelles) : null;

    if (!title || !description || !categorie) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!me.locationId) {
      return NextResponse.json({ error: "Localisation utilisateur manquante" }, { status: 400 });
    }

    const lastTask = await prisma.ticket.findFirst({
      where: { type: "task" },
      orderBy: { creationDate: "desc" },
      select: { number: true }
    });

    let newNumber = "TSK000001";
    if (lastTask && lastTask.number) {
      const n = parseInt(lastTask.number.replace("TSK", ""), 10);
      if (!isNaN(n)) {
        const next = n + 1;
        newNumber = "TSK" + String(next).padStart(6, "0");
      }
    }

    const status = await prisma.status.findUnique({
      where: { label: "Ouvert" },
      select: { id: true }
    });
    if (!status || !status.id) {
      return NextResponse.json({ error: "Statut 'Ouvert' introuvable" }, { status: 400 });
    }

    const category = await prisma.category.findFirst({
      where: { label: categorie },
      select: { id: true }
    });
    if (!category || !category.id) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
    }

    const priority = await prisma.priority.findUnique({
      where: { label: "Moyenne" },
      select: { id: true }
    });
    if (!priority || !priority.id) {
      return NextResponse.json({ error: "Priorité par défaut introuvable" }, { status: 400 });
    }

    // ICI: préfixe correct
    const assignmentGroup = await prisma.group.findFirst({
      where: {
        groupName: { startsWith: "Support.Taches." },
        locationId: me.locationId
      },
      select: { id: true }
    });

    const approverId = me.managerId ? me.managerId : me.id;

    const now = new Date();

    const created = await prisma.ticket.create({
      data: {
        number: newNumber,
        title: title,
        description: description,
        type: "task",

        statusId: status.id,
        priorityId: priority.id,
        categoryId: category.id,

        slaId: null,

        isApproved: false,
        approverId: approverId,

        createdById: me.id,
        assignedToId: null,
        assignmentGroupId: assignmentGroup ? assignmentGroup.id : null,
        locationId: me.locationId,

        creationDate: now,
        updateDate: now,
        closedDate: null,

        updatedById: null,
        closedById: null,
        isBreached: false,
        responseDate: null,

        additionalInfo: informationsAdditionnelles
      },
      select: { id: true, number: true }
    });

    return NextResponse.json({ success: true, ticket: created }, { status: 201 });
  } catch (e) {
    console.error("Erreur création task:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
