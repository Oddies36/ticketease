import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
  }

  try {
    const users = await prisma.groupUser.findMany({
      where: {
        groupId: parseInt(groupId),
      },
      include: {
        user: true,
      },
    });

    const formattedUsers = users.map((entry) => ({
      id: entry.user.id,
      firstName: entry.user.firstName,
      lastName: entry.user.lastName,
      isAdmin: entry.isAdmin
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Erreur lors de la récupération des membres :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}