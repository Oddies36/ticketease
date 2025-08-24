import { beforeEach, expect, test, vi } from "vitest";

// Mock AVANT les imports de la route
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  // on construit le mock ici, pas de variable externe
  const prisma = {
    ticket: { findFirst: vi.fn(), create: vi.fn() },
    status: { findUnique: vi.fn() },
    priority: { findUnique: vi.fn() },
    category: { findFirst: vi.fn() },
    sLA: { findFirst: vi.fn(), findUnique: vi.fn() },
    group: { findFirst: vi.fn() },
  };
  return { prisma };
});

// Import après les mocks
import { POST } from "@/app/api/incidents/create-incident/route";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "INC000001" });
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 }); // "Ouvert"
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 }); // selon impact
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 }); // catégorie
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 }); // SLA par priorité
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 }); // assignment group
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 }); // 60 min
  (prisma.ticket.create as any).mockResolvedValue({});
});

//-------------------HAPPY PATH-------------------

test("happy path - crée un incident complet avec payload exact", async () => {
  // fige l’horloge pour des dates déterministes
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T10:00:00Z"));

  // utilisateur valide
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  // lookups Prisma attendus
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "INC000001" });
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 });
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 }); // 60 min
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.ticket.create as any).mockResolvedValue({});

  const body = {
    title: "Problème réseau",
    description: "Impossible de se connecter au VPN",
    impact: "individuel",
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(201);
  expect(json).toEqual({ message: "Incident créé avec succès" });
  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);

  const now = new Date("2025-01-01T10:00:00Z");
  const expected = {
    number: "INC000002",
    title: body.title,
    description: body.description,
    type: "incident",

    statusId: 1,
    priorityId: 2,
    categoryId: 3,
    slaId: 4,

    isApproved: true,
    approverId: null,

    createdById: 7,
    assignedToId: null,
    assignmentGroupId: 5,
    locationId: 42,

    creationDate: now,
    updateDate: now,
    closedDate: null,

    updatedById: null,
    closedById: null,

    isBreached: false,
    responseDate: new Date(now.getTime() + 60 * 60 * 1000),
    additionalInfo: null,
  };

  const passed = (prisma.ticket.create as any).mock.calls[0][0].data;
  expect(passed).toEqual(expected);
  expect(Object.keys(passed).sort()).toEqual(Object.keys(expected).sort());

  vi.useRealTimers();
});

//-------------------HAPPY PATH-------------------

test("happy path - aucun incident précédent → number=INC000001", async () => {
  // fige l’horloge pour des dates déterministes
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T10:00:00Z"));

  // utilisateur valide
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  // aucun incident précédent
  (prisma.ticket.findFirst as any).mockResolvedValue(null);

  // lookups Prisma attendus
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 });
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 }); // 60 min
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.ticket.create as any).mockResolvedValue({});

  const body = {
    title: "Problème réseau",
    description: "Impossible de se connecter au VPN",
    impact: "individuel",
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(201);
  expect(json).toEqual({ message: "Incident créé avec succès" });
  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);

  const now = new Date("2025-01-01T10:00:00Z");
  const expected = {
    number: "INC000001", // ← aucun précédent → premier numéro
    title: body.title,
    description: body.description,
    type: "incident",

    statusId: 1,
    priorityId: 2,
    categoryId: 3,
    slaId: 4,

    isApproved: true,
    approverId: null,

    createdById: 7,
    assignedToId: null,
    assignmentGroupId: 5,
    locationId: 42,

    creationDate: now,
    updateDate: now,
    closedDate: null,

    updatedById: null,
    closedById: null,

    isBreached: false,
    responseDate: new Date(now.getTime() + 60 * 60 * 1000),
    additionalInfo: null,
  };

  const passed = (prisma.ticket.create as any).mock.calls[0][0].data;
  expect(passed).toEqual(expected);
  expect(Object.keys(passed).sort()).toEqual(Object.keys(expected).sort());

  vi.useRealTimers();
});

//-------------------TITRE MANQUANT-------------------

test("validation - manque title → 400 (champs requis)", async () => {
  // ce test suppose que la route renvoie 400 si "title" est absent
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  const body = {
    // title manquant
    description: "Impossible de se connecter au VPN",
    impact: "individuel",
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({
    error: "Champs requis manquants pour la création du ticket",
  });
  expect(prisma.ticket.create).not.toHaveBeenCalled();
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.status.findUnique).not.toHaveBeenCalled();
  expect(prisma.priority.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findUnique).not.toHaveBeenCalled();
  expect(prisma.group.findFirst).not.toHaveBeenCalled();
});

//-------------------DESCRIPTION MANQUANTE-------------------

test("validation - manque description → 400 (champs requis)", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  const body = {
    title: "Problème",
    impact: "individuel",
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({
    error: "Champs requis manquants pour la création du ticket",
  });

  expect(prisma.ticket.create).not.toHaveBeenCalled();
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.status.findUnique).not.toHaveBeenCalled();
  expect(prisma.priority.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findUnique).not.toHaveBeenCalled();
  expect(prisma.group.findFirst).not.toHaveBeenCalled();
});

//-------------------Impact autre que ENUM autorisé-------------------

test("validation - Impact autre que ENUM autorisé → 400 (champs requis)", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  const body = {
    title: "Problème",
    description: "J'ai un problème avec mon ordinateur",
    impact: "individuel",
    categorie: "Reseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({
    error: "Champs requis manquants pour la création du ticket",
  });

  expect(prisma.ticket.create).not.toHaveBeenCalled();
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.status.findUnique).not.toHaveBeenCalled();
  expect(prisma.priority.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findUnique).not.toHaveBeenCalled();
  expect(prisma.group.findFirst).not.toHaveBeenCalled();
});

//-------------------categorie autre que ENUM autorisé-------------------

test("validation - Impact autre que ENUM autorisé → 400 (champs requis)", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  const body = {
    title: "Problème",
    description: "J'ai un problème avec mon ordinateur",
    impact: "autre",
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({
    error: "Champs requis manquants pour la création du ticket",
  });

  expect(prisma.ticket.create).not.toHaveBeenCalled();
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.status.findUnique).not.toHaveBeenCalled();
  expect(prisma.priority.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findUnique).not.toHaveBeenCalled();
  expect(prisma.group.findFirst).not.toHaveBeenCalled();
});

test("crée un incident valide et incrémente le numéro", async () => {
  // sécurise tous les retours ici, juste pour CE test
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "INC000001" });
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 });
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 });
  (prisma.ticket.create as any).mockResolvedValue({});
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  const body = {
    title: "Problème réseau",
    description: "Impossible de se connecter au VPN",
    impact: "individuel", // accepté par ta fonction priority()
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  // si jamais ça retombe à 400, affiche l'erreur pour debug immédiat:
  if (res.status !== 201) {
    // petite aide de debug locale: commente la ligne suivante quand tout passe
    console.error("DEBUG create-incident res:", res.status, json);
  }

  expect(res.status).toBe(201);
  expect(json).toEqual({ message: "Incident créé avec succès" });

  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);
  const args = (prisma.ticket.create as any).mock.calls[0][0];
  expect(args.data.number).toBe("INC000002");
  expect(args.data.title).toBe(body.title);
  expect(args.data.statusId).toBe(1);
  expect(args.data.priorityId).toBe(2);
  expect(args.data.categoryId).toBe(3);
  expect(args.data.slaId).toBe(4);
  expect(args.data.assignmentGroupId).toBe(5);
  expect(args.data.locationId).toBe(42);
  expect(args.data.responseDate).toBeInstanceOf(Date);
});

test("renvoie 400 si l'utilisateur n'a pas de locationId", async () => {
  (getAuthenticatedUser as any).mockResolvedValueOnce({
    id: 7,
    locationId: null,
  });

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify({
      title: "Incident",
      description: "Tester",
      impact: "individuel",
      categorie: "Réseau",
    }),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({
    error: "L'utilisateur n'a pas de localisation définie",
  });
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("renvoie 400 ou 500 si champs requis manquants/JSON invalide", async () => {
  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify({}), // manquant
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  expect([400, 500]).toContain(res.status);
});

test("numérotation – passage 999999 → 1000000", async () => {
  // fige l’horloge (optionnel, utile si tu vérifies aussi les dates)
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T10:00:00Z"));

  // utilisateur valide
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });

  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "INC999999" });

  // lookups Prisma requis
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 });
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 });
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.ticket.create as any).mockResolvedValue({});

  const body = {
    title: "Problème réseau",
    description: "Impossible de se connecter au VPN",
    impact: "individuel",
    categorie: "Réseau",
  };

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(201);
  expect(json).toEqual({ message: "Incident créé avec succès" });
  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);

  const args = (prisma.ticket.create as any).mock.calls[0][0];
  expect(args.data.number).toBe("INC1000000");

  vi.useRealTimers();
});

test("localisation manquante → 400 et aucun accès DB", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: null });

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Incident valide",
      description: "Description valide",
      impact: "individuel",
      categorie: "Réseau",
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({
    error: "L'utilisateur n'a pas de localisation définie",
  });

  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.status.findUnique).not.toHaveBeenCalled();
  expect(prisma.priority.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findFirst).not.toHaveBeenCalled();
  expect(prisma.sLA.findUnique).not.toHaveBeenCalled();
  expect(prisma.group.findFirst).not.toHaveBeenCalled();
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("impact=individuel → priority label 'Faible'", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "INC000001" });
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 });
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 });
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.ticket.create as any).mockResolvedValue({});

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Titre valide",
      description: "Description valide",
      impact: "individuel",
      categorie: "Réseau",
    }),
  });
  const res = await POST(req);
  expect(res.status).toBe(201);

  expect(prisma.priority.findUnique).toHaveBeenCalledWith({
    where: { label: "Faible" },
    select: { id: true },
  });
});

test("assignment group - filtre startsWith + location", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: 42 });
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "INC000001" });
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.sLA.findFirst as any).mockResolvedValue({ id: 4 });
  (prisma.sLA.findUnique as any).mockResolvedValue({ responseTime: 60 });
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.ticket.create as any).mockResolvedValue({});

  const req = new Request("http://localhost/api/incidents/create-incident", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Titre valide",
      description: "Description valide",
      impact: "individuel",
      categorie: "Réseau",
    }),
  });
  const res = await POST(req);
  expect(res.status).toBe(201);

  expect(prisma.group.findFirst).toHaveBeenCalledWith({
    where: {
      AND: [
        { groupName: { startsWith: "Support.Incidents." } },
        { locationId: 42 },
      ],
    },
    select: { id: true },
  });
});
