import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  const { impact, description, categorie, title } = await request.json();
  try {

    //Number
    const lastIncident = await prisma.ticket.findFirst({
      where: { type: "incident" },
      orderBy: { creationDate: "desc" },
      select: { number: true }
    });

    let newIncident = "INC000001";
    if(lastIncident?.number){
        const lastNumber = parseInt(lastIncident.number.replace("INC", ""), 10);
        const newNumber = lastNumber + 1;
        newIncident = `INC${newNumber.toString().padStart(6, "0")}`;
    }

    //Type
    const type = "incident";

    //StatusId
    const statusId = await prisma.status.findUnique({
      where: { label: "Ouvert" },
      select: { id: true }
    })

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
      select: { id: true }
    });

    //CategoryId
    const categoryId = await prisma.category.findFirst({
      where: { label: categorie },
      select: { id: true }
    })

    //SLA id
    const slaId = await prisma.sLA.findFirst({
      where: { priorityId: getPriorityId?.id },
      select: { id: true }
    });

    const isApproved = true;
    const approverId = null;

    //CreatedBy
    const createdBy = user?.id;

    //AssignedToId
    const assignedToId = null;

    //LocationId
    const locationId = user?.locationId;

    if (!user?.locationId) {
      return NextResponse.json({ error: "L'utilisateur n'a pas de localisation définie" }, { status: 400 });
    }


    //AssignmentGroupId
    const groupName = "Support.Incidents.";
    const assignmentGroupId = await prisma.group.findFirst({
      where: { AND: [ {groupName: { startsWith: groupName }}, {locationId: locationId} ] },
      select: { id: true }
    });

    const creationDate = new Date();
    const updateDate = new Date();
    const closedDate = null;

    const updatedBy = null;
    const closedBy = null;
    const isBreached = false;

    const responseTime = await prisma.sLA.findUnique({
      where: { id: slaId?.id },
      select: { responseTime: true }
    })

    const responseDate = new Date(Date.now() + (responseTime?.responseTime ?? 0) * 60 * 1000);

    const additionalInfo = null;

console.log("statusId:", statusId);
console.log("getPriorityId:", getPriorityId);
console.log("categoryId:", categoryId);
console.log("createdBy:", createdBy);
console.log("user.locationId:", user?.locationId);

    if (!statusId?.id || !getPriorityId?.id || !categoryId?.id || !createdBy || !user?.locationId) {
      return NextResponse.json({ error: "Champs requis manquants pour la création du ticket" }, { status: 400 });
    }





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
        additionalInfo: additionalInfo
      }
    })

    

    return NextResponse.json({ message: "Incident créé avec succès" }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'incident:", error);
    return NextResponse.json([], { status: 500 });
  }
}
