import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = parseInt(new URL(request.url).searchParams.get("userId") || "");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const groupMemberships = await prisma.groupUser.findMany({
    where: { userId },
    include: {
      group: true,
    },
  });

  const adminGroups = groupMemberships
    .filter((membership) => membership.isAdmin)
    .map((membership) => membership.group);

  const memberGroups = groupMemberships.map((membership) => membership.group);

  return NextResponse.json({
    adminGroups,
    memberGroups,
  });
}