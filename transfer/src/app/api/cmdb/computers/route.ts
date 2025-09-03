import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/cmdb/computers
 * Liste paginée + triée des ordinateurs
 */
export async function GET(req: Request) {
  try {
    // Vérifie si l'utilisateur est authentifié
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifie les droits : admin OU membre d'un groupe Support.*
    const memberships = await prisma.groupUser.findMany({
      where: { userId: me.id },
      include: { group: true },
    });
    const supportMembership = memberships.find((m) =>
      m.group.groupName.startsWith("Support.")
    );
    if (!me.isAdmin && !supportMembership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Params URL
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const pageParam = url.searchParams.get("page") || "1";
    const pageSizeParam = url.searchParams.get("pageSize") || "10";
    const orderByParam = url.searchParams.get("orderBy") || "computerName";
    const orderParam = url.searchParams.get("order") || "asc";

    let page = parseInt(pageParam, 10);
    let pageSize = parseInt(pageSizeParam, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

    // Filtre recherche
    let where: any = {};
    if (search) {
      where = {
        OR: [
          { computerName: { contains: search, mode: "insensitive" } },
          { serialNumber: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Vérifie si la colonne est valide pour Prisma
    const validColumns = [
      "computerName",
      "serialNumber",
      "createdAt",
      "assignedAt",
    ];
    const orderByField = validColumns.includes(orderByParam)
      ? orderByParam
      : "computerName";

    const order: "asc" | "desc" = orderParam === "desc" ? "desc" : "asc";

    // Total
    const total = await prisma.computer.count({ where });

    // Items avec pagination et tri
    const items = await prisma.computer.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { [orderByField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/cmdb/computers
 * Création d’un nouvel ordinateur
 */
export async function POST(req: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifie les droits
    const memberships = await prisma.groupUser.findMany({
      where: { userId: me.id },
      include: { group: true },
    });
    const supportMembership = memberships.find((m) =>
      m.group.groupName.startsWith("Support.")
    );
    if (!me.isAdmin && !supportMembership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

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
      const user = await prisma.user.findUnique({ where: { id: v } });
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
        computerName,
        serialNumber,
        assignedToId,
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
