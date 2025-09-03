// tests/api/users/new-user.test.ts
import { beforeEach, expect, test, vi } from "vitest";

// ---- Mocks AVANT les imports de la route ----
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const prisma = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    location: { findUnique: vi.fn() },
    group: { findFirst: vi.fn(), findMany: vi.fn() },
    groupUser: {
      findUnique: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  return { prisma };
});

vi.mock("bcryptjs", () => {
  const hash = vi.fn();
  return { default: { hash } };
});

vi.mock("@/lib/resend", () => ({
  sendEmailHtml: vi.fn(),
  resendEmail: vi.fn(),
}));

// ---- Imports APRÈS mocks ----
import { POST } from "@/app/api/users/new-user/route";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

beforeEach(() => {
  vi.clearAllMocks();

  // Auth par défaut: connecté
  (getAuthenticatedUser as any).mockResolvedValue({ id: 10 });

  // Contexte/guard par défaut: ok
  (prisma.location.findUnique as any).mockResolvedValue({
    id: 42,
    name: "Bruxelles",
  });
  (prisma.group.findFirst as any).mockResolvedValue({ id: 100 });
  (prisma.groupUser.findUnique as any).mockResolvedValue({
    userId: 10,
    groupId: 100,
  });

  // Email pro pas encore pris
  (prisma.user.findUnique as any).mockResolvedValue(null);

  // Hash bcrypt
  (bcrypt as any).hash.mockResolvedValue("hashed123");

  // Création user
  (prisma.user.create as any).mockResolvedValue({ id: 200, isAdmin: false });

  // Admin stuff
  (prisma.group.findMany as any).mockResolvedValue([]);
  (prisma.groupUser.createMany as any).mockResolvedValue({ count: 0 });
  (prisma.groupUser.updateMany as any).mockResolvedValue({ count: 0 });
});

// ------------------- HAPPY PATH -------------------

test("happy path - cree un utilisateur standard", async () => {
  const body = {
    firstName: "Maxime",
    lastName: "Paix",
    emailPrivate: "maxime.paix@ticketease.be",
    password: "Azerty123+",
    isAdmin: false,
    mustChangePassword: false,
    locationId: 42,
  };

  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(200);
  expect(json).toEqual({
    success: true,
    message: "Utilisateur créé avec succès.",
  });

  expect((bcrypt as any).hash).toHaveBeenCalledWith("Azerty123+", 10);
  expect(prisma.user.create).toHaveBeenCalledTimes(1);

  const passed = (prisma.user.create as any).mock.calls[0][0].data;
  expect(passed).toEqual({
    firstName: "Maxime",
    lastName: "Paix",
    emailPrivate: "maxime.paix@ticketease.be",
    emailProfessional: "maxime.paix@ticketease.be",
    password: "hashed123",
    isAdmin: false,
    mustChangePassword: false,
    locationId: 42,
  });
});

// ------------------- VALIDATION ZOD -------------------

test("validation - firstName manquant -> 400", async () => {
  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      // firstName manquant
      lastName: "Paix",
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty123+",
      locationId: 42,
    }),
  });

  const res = await POST(req);
  const json = await res.json();
  expect(res.status).toBe(400);
  expect(json).toEqual({ success: false, message: "Paramètres manquants." });
  expect(prisma.user.create).not.toHaveBeenCalled();
});

test("validation - nom et prenom formats invalides -> 400", async () => {
  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "maxime", // doit commencer par majuscule
      lastName: "O'Paix", // apostrophe interdite
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty123+",
      locationId: 42,
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.user.create).not.toHaveBeenCalled();
});

test("validation - emailPrivate invalide -> 400", async () => {
  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Maxime",
      lastName: "Paix",
      emailPrivate: "maxime.paix@@ticketease.be", // invalide mais garde le domaine
      password: "Azerty123+",
      locationId: 42,
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.user.create).not.toHaveBeenCalled();
});

test("validation - password trop court -> 400", async () => {
  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Maxime",
      lastName: "Paix",
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty1", // < 8
      locationId: 42,
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.user.create).not.toHaveBeenCalled();
});

test("validation - locationId manquant -> 400", async () => {
  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Maxime",
      lastName: "Paix",
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty123+",
      // pas de locationId
    }),
  });

  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(prisma.user.create).not.toHaveBeenCalled();
});

test("auth - non authentifie -> 401", async () => {
  (getAuthenticatedUser as any).mockResolvedValueOnce(null);

  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Maxime",
      lastName: "Paix",
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty123+",
      locationId: 42,
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(401);
  expect(json).toEqual({ success: false, message: "Non authentifié" });
  expect(prisma.user.create).not.toHaveBeenCalled();
});

// ------------------- EXISTANT / ADMIN -------------------

test("email pro deja existant -> 200 et aucun create", async () => {
  (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 123 });

  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Maxime",
      lastName: "Paix",
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty123+",
      locationId: 42,
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(200);
  expect(json).toEqual({ success: false, message: "Cet email existe déjà." });
  expect(prisma.user.create).not.toHaveBeenCalled();
});

test("isAdmin=true -> ajout a tous les groupes et set isAdmin", async () => {
  (prisma.user.create as any).mockResolvedValueOnce({ id: 200, isAdmin: true });
  (prisma.group.findMany as any).mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

  const req = new Request("http://localhost/api/users/new-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Maxime",
      lastName: "Paix",
      emailPrivate: "maxime.paix@ticketease.be",
      password: "Azerty123+",
      locationId: 42,
      isAdmin: true,
    }),
  });

  const res = await POST(req);
  const json = await res.json();

  expect(res.status).toBe(200);
  expect(json).toEqual({
    success: true,
    message: "Utilisateur créé avec succès.",
  });

  expect(prisma.group.findMany).toHaveBeenCalledTimes(1);
  expect(prisma.groupUser.createMany).toHaveBeenCalledWith({
    data: [
      { userId: 200, groupId: 1, isAdmin: true },
      { userId: 200, groupId: 2, isAdmin: true },
    ],
    skipDuplicates: true,
  });
  expect(prisma.groupUser.updateMany).toHaveBeenCalledWith({
    where: { userId: 200 },
    data: { isAdmin: true },
  });
});
