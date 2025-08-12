// src/app/api/users/by-location/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locationName = url.searchParams.get("location");
    if (!locationName) {
      return NextResponse.json({ error: "Paramètre location manquant" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({ where: { name: locationName } });
    if (!location) {
      return NextResponse.json({ error: "Localisation inconnue" }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: { locationId: location.id },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
