import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const prisma = {
    ticket: { findFirst: vi.fn(), create: vi.fn() },
    status: { findUnique: vi.fn() },
    priority: { findUnique: vi.fn() },
    category: { findFirst: vi.fn() },
    group: { findFirst: vi.fn() },
  };
  return { prisma };
});

import { POST } from "@/app/api/tasks/create/route";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

beforeEach(() => {
  vi.clearAllMocks();
  (getAuthenticatedUser as any).mockResolvedValue({
    id: 7,
    locationId: 42,
    managerId: 13,
  });
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "TSK000001" });
  (prisma.status.findUnique as any).mockResolvedValue({ id: 1 });
  (prisma.priority.findUnique as any).mockResolvedValue({ id: 2 });
  (prisma.category.findFirst as any).mockResolvedValue({ id: 3 });
  (prisma.group.findFirst as any).mockResolvedValue({ id: 5 });
  (prisma.ticket.create as any).mockResolvedValue({
    id: 999,
    number: "TSK000002",
  });
});

// ------------------- HAPPY PATH -------------------

test("happy path - crée une tâche complète avec payload exact", async () => {
  vi.useFakeTimers();
  const now = new Date("2025-01-01T10:00:00Z");
  vi.setSystemTime(now);

  const body = {
    title: "Demande de laptop",
    description: "Ordinateur pour nouvel employé",
    categorie: "Demande de laptop",
    demandePour: "Maxime",
    informationsAdditionnelles: "16Go RAM",
  };

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(201);
  expect(json).toEqual({
    success: true,
    ticket: { id: 999, number: "TSK000002" },
  });
  expect(prisma.ticket.create).toHaveBeenCalledTimes(1);

  const passed = (prisma.ticket.create as any).mock.calls[0][0].data;
  expect(passed).toEqual({
    number: "TSK000002",
    title: body.title,
    description: body.description,
    type: "task",

    statusId: 1,
    priorityId: 2,
    categoryId: 3,

    slaId: null,

    isApproved: false,
    approverId: 13,

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
    responseDate: null,

    additionalInfo: body.informationsAdditionnelles,
  });

  vi.useRealTimers();
});

test("happy path - aucune tâche précédente -> number=TSK000001", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T10:00:00Z"));
  (prisma.ticket.findFirst as any).mockResolvedValue(null);
  (prisma.ticket.create as any).mockResolvedValue({
    id: 1,
    number: "TSK000001",
  });

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(201);
  expect(json).toEqual({
    success: true,
    ticket: { id: 1, number: "TSK000001" },
  });

  const args = (prisma.ticket.create as any).mock.calls[0][0];
  expect(args.data.number).toBe("TSK000001");

  vi.useRealTimers();
});

// ------------------- NUMÉROTATION -------------------

test("numérotation - passage 000999 -> 001000", async () => {
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "TSK000999" });

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(201);

  const args = (prisma.ticket.create as any).mock.calls[0][0];
  expect(args.data.number).toBe("TSK001000");
});

test("numérotation - passage 999999 -> 1000000", async () => {
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "TSK999999" });

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(201);

  const args = (prisma.ticket.create as any).mock.calls[0][0];
  expect(args.data.number).toBe("TSK1000000");
});

test("numérotation - dernier numéro invalide -> TSK000001", async () => {
  (prisma.ticket.findFirst as any).mockResolvedValue({ number: "TSKsdfg" });

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(201);

  const args = (prisma.ticket.create as any).mock.calls[0][0];
  expect(args.data.number).toBe("TSK000001");
});

// ------------------- VALIDATION ZOD -------------------

test("validation - title manquant -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({ error: "Champs requis manquants" });
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("validation - title trop court -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "abcd",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("validation - description manquante -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("validation - description trop courte -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "abcd",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("validation - categorie hors enum -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptopx",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("validation - demandePour manquant -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("validation - demandePour trop court -> 400", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "ab",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

// ------------------- AUTH -------------------

test("auth - non authentifié -> 401", async () => {
  (getAuthenticatedUser as any).mockResolvedValue(null);

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(401);
  expect(json).toEqual({ error: "Non authentifié" });
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("contexte - sans locationId -> 400 et aucun accès DB", async () => {
  (getAuthenticatedUser as any).mockResolvedValue({ id: 7, locationId: null });

  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(400);
  expect(json).toEqual({ error: "Localisation utilisateur manquante" });
  expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  expect(prisma.status.findUnique).not.toHaveBeenCalled();
  expect(prisma.priority.findUnique).not.toHaveBeenCalled();
  expect(prisma.category.findFirst).not.toHaveBeenCalled();
  expect(prisma.group.findFirst).not.toHaveBeenCalled();
  expect(prisma.ticket.create).not.toHaveBeenCalled();
});

test("assignment group - filtre startsWith + location", async () => {
  const req = new Request("http://localhost/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Demande valide",
      description: "Description valide",
      categorie: "Demande de laptop",
      demandePour: "Maxime",
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(201);

  expect(prisma.group.findFirst).toHaveBeenCalledWith({
    where: {
      groupName: { startsWith: "Support.Taches." },
      locationId: 42,
    },
    select: { id: true },
  });
});
