import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const pageParam = url.searchParams.get("page") || "1";
    const pageSizeParam = url.searchParams.get("pageSize") || "10";

    let page = parseInt(pageParam, 10);
    let pageSize = parseInt(pageSizeParam, 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(pageSize) || pageSize < 1) {
      pageSize = 10;
    }

    let where: any = {};
    if (search) {
      where = {
        OR: [
          { computerName: { contains: search, mode: "insensitive" } },
          { serialNumber: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const total = await prisma.computer.count({ where });

    const items = await prisma.computer.findMany({
      where: where,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items: items,
      total: total,
      page: page,
      pageSize: pageSize,
    });
  } catch (e) {
    console.error("Erreur GET /api/cmdb/computers:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const computerNameRaw = body.computerName;
    const serialNumberRaw = body.serialNumber;
    const assignedToIdRaw = body.assignedToId;

    const computerName =
      typeof computerNameRaw === "string" ? computerNameRaw.trim() : "";
    const serialNumber =
      typeof serialNumberRaw === "string" ? serialNumberRaw.trim() : "";

    if (!computerName || !serialNumber) {
      return NextResponse.json(
        { error: "Nom et numéro de série requis" },
        { status: 400 }
      );
    }

    let assignedToId: number | null = null;
    if (assignedToIdRaw !== undefined && assignedToIdRaw !== null) {
      const v = Number(assignedToIdRaw);
      if (isNaN(v)) {
        return NextResponse.json(
          { error: "assignedToId invalide" },
          { status: 400 }
        );
      }
      const user = await prisma.user.findUnique({
        where: { id: v },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 400 }
        );
      }
      assignedToId = v;
    }

    const computer = await prisma.computer.create({
      data: {
        computerName: computerName,
        serialNumber: serialNumber,
        assignedToId: assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ computer }, { status: 201 });
  } catch (e: any) {
    if (e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Numéro de série déjà utilisé" },
        { status: 409 }
      );
    }
    console.error("Erreur POST /api/cmdb/computers:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
