import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const computer = await prisma.computer.findUnique({
      where: { id: id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!computer) {
      return NextResponse.json(
        { error: "Ordinateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ computer });
  } catch (e) {
    console.error("Erreur GET /api/cmdb/computers/get-computer:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
