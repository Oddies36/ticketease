import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { groupId, userId, isAdmin } = body;

  if (!groupId || !userId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    // Check if user already in group
    const existing = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (existing) {
      // Already in group → update admin status
      const updated = await prisma.groupUser.update({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        data: {
          isAdmin,
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json({
        id: updated.user.id,
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
        isAdmin: updated.isAdmin,
      });
    } else {
      // New membership
      const created = await prisma.groupUser.create({
        data: {
          userId,
          groupId,
          isAdmin,
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json({
        id: created.user.id,
        firstName: created.user.firstName,
        lastName: created.user.lastName,
        isAdmin: created.isAdmin,
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}