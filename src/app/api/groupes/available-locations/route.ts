import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefix = req.nextUrl.searchParams.get("prefix") ?? "";

  const groupMemberships = await prisma.groupUser.findMany({
    where: {
      userId: user.id,
      group: {
        groupName: {
          startsWith: prefix,
        },
        location: {
          isNot: null,
        },
      },
    },
    select: {
      group: {
        select: {
          groupName: true,
          location: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });


  const locations = Array.from(
    new Set(
      groupMemberships
        .map((m) => m.group.location?.name)
        .filter((name): name is string => !!name)
    )
  );


  return NextResponse.json({ locations });
}
