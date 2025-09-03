import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";

// Validation du payload avec Zod
const IncidentSchema = z.object({
  title: z.string().trim().min(5),
  description: z.string().trim().min(5),
  impact: z.enum(["individuel", "plusieurs", "service", "global"]),
  categorie: z.enum([
    "Accès",
    "Hardware",
    "Réseau",
    "Sécurité",
    "Software",
    "Système",
  ]),
});

/**
 * POST /api/incidents/create-incident
 * Création d'un nouvel incident.
 */
export async function POST(request: Request) {
  //Vérifie l'utilisateur connecté à partir du cookie JWT
  const user = await getAuthenticatedUser();
  //Récupère les informations du frontend

  try {
    const parsed = IncidentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Champs requis manquants pour la création du ticket" },
        { status: 400 }
      );
    }

    const { title, description, impact, categorie } = parsed.data;

    if (!user?.locationId) {
      return NextResponse.json(
        { error: "L'utilisateur n'a pas de localisation définie" },
        { status: 400 }
      );
    }

    //Génération du numéro d'incident en fonction du dernier dans la DB
    const lastIncident = await prisma.ticket.findFirst({
      where: { type: "incident" },
      orderBy: { number: "desc" },
      select: { number: true },
    });

    let newIncident = "INC000001";
    if (lastIncident?.number) {
      const lastNumber = parseInt(lastIncident.number.replace("INC", ""), 10);

      const newNumber = lastNumber + 1;
      newIncident = `INC${newNumber.toString().padStart(6, "0")}`;
    }

    //Type
    const type = "incident";

    //StatusId
    const statusId = await prisma.status.findUnique({
      where: { label: "Ouvert" },
      select: { id: true },
    });

    //PriorityId
    const priority = (impact: string): string => {
      switch (impact) {
        case "individuel":
          return "Faible";
        case "plusieurs":
          return "Moyenne";
        case "service":
          return "Haute";
        case "global":
          return "Critique";
        default:
          throw new Error("Impact Inconnu");
      }
    };

    const getPriorityId = await prisma.priority.findUnique({
      where: { label: priority(impact) },
      select: { id: true },
    });

    //CategoryId
    const categoryId = await prisma.category.findFirst({
      where: { label: categorie },
      select: { id: true },
    });

    //SLA id
    const slaId = await prisma.sLA.findFirst({
      where: { priorityId: getPriorityId?.id },
      select: { id: true },
    });

    const isApproved = true;
    const approverId = null;

    //CreatedBy
    const createdBy = user?.id;

    //AssignedToId
    const assignedToId = null;

    //LocationId
    const locationId = user?.locationId;

    //AssignmentGroupId
    const groupName = "Support.Incidents.";
    const assignmentGroupId = await prisma.group.findFirst({
      where: {
        AND: [
          { groupName: { startsWith: groupName } },
          { locationId: locationId },
        ],
      },
      select: { id: true },
    });

    if (!assignmentGroupId?.id) {
      return NextResponse.json(
        {
          error:
            "Votre localisation n'a pas de groupe de support. Veuillez contacter votre administrateur.",
        },
        { status: 400 }
      );
    }

    const creationDate = new Date();
    const updateDate = new Date();
    const closedDate = null;

    const updatedBy = null;
    const closedBy = null;
    const isBreached = false;

    const responseTime = await prisma.sLA.findUnique({
      where: { id: slaId?.id },
      select: { responseTime: true },
    });

    const responseDate = new Date(
      Date.now() + (responseTime?.responseTime ?? 0) * 60 * 1000
    );

    //Utilisé pour les tâches
    const additionalInfo = null;

    if (!statusId?.id || !getPriorityId?.id || !categoryId?.id || !createdBy) {
      return NextResponse.json(
        { error: "Champs requis manquants pour la création du ticket" },
        { status: 400 }
      );
    }

    //Création de l'incident avec prisma
    await prisma.ticket.create({
      data: {
        number: newIncident,
        title: title,
        description: description,
        type: type,
        statusId: statusId?.id,
        priorityId: getPriorityId?.id,
        categoryId: categoryId?.id,
        slaId: slaId?.id,
        isApproved: isApproved,
        approverId: approverId,
        createdById: createdBy,
        assignedToId: assignedToId,
        assignmentGroupId: assignmentGroupId?.id,
        locationId: locationId!,
        creationDate: creationDate,
        updateDate: updateDate,
        closedDate: closedDate,
        updatedById: updatedBy,
        closedById: closedBy,
        isBreached: isBreached,
        responseDate: responseDate,
        additionalInfo: additionalInfo,
      },
    });

    return NextResponse.json(
      { message: "Incident créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur dans create-incident:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }
    return NextResponse.json([], { status: 500 });
  }
}
