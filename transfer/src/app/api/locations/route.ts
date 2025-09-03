import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/locations?location=...
 * Récupère une localisation précise par son nom.
 */
export async function GET(request: NextRequest) {
  // Récupère le paramètre "location" dans l'URL
  const location = request.nextUrl.searchParams.get("location") ?? "";
  try {
    // Recherche une localisation unique correspondant au nom donné
    const locations = await prisma.location.findUnique({
      where: { name: location },
      select: { name: true, id: true },
    });
    // Retourne la localisation trouvée
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
