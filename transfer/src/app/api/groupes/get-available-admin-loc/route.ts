import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getAuthenticatedUser();
  if (!me) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") ?? "";

  const adminOnly = prefix.startsWith("Gestion.Groupes.");

const memberships = await prisma.groupUser.findMany({
  where: {
    userId: me.id,
    ...(adminOnly ? { isAdmin: true } : {}),
    group: {
      groupName: { startsWith: prefix },
      location: { isNot: null },
    },
  },
  include: { group: { include: { location: true } } },
});

  const locations = Array.from(
    new Set(
      memberships
        .map((m) => m.group.location?.name)
        .filter((n): n is string => Boolean(n))
    )
  );

  return NextResponse.json({ locations });
}
