import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { groupName, location, description, owner } = await request.json();

  try {
    const existingGroup = await prisma.group.findFirst({
      where: {
        groupName: groupName,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        {
          success: false,
          message: "Le groupe existe déjà.",
        },
        {
          status: 409,
        }
      );
    }

    const newGroup = await prisma.group.create({
      data: {
        groupName: groupName,
        locationId: location,
        description: description,
        ownerId: owner,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.groupUser.create({
      data: {
        userId: owner,
        groupId: newGroup.id,
        isAdmin: true,
      },
    });

    return NextResponse.json({ success: true, data: newGroup });
  } catch (error) {
    console.error("Erreur lors de la création du groupe:", error);
    return NextResponse.json([], { status: 500 });
  }
}
