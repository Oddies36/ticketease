import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendEmailHtml, resendEmail } from "@/lib/resend"; // envoi d'email (actuellement désactivé plus bas)
import { z } from "zod";

/** schéma Zod pour valider un nom/prénom
 * - supprime espaces en trop
 * - au moins 5 caractères
 * - regex: ^ début de chaîne, [A-Z] majuscule, [a-z]* zéro ou plusieurs minuscules,
 * (?:-[A-Z][a-z]*)* zéro ou plusieurs répétitions d’un tiret suivi d’une majuscule puis de minuscules, $ fin de chaîne
 */
const NameSchema = z
  .string()
  .trim()
  .min(5)
  .regex(/^[A-Z][a-z]*(?:-[A-Z][a-z]*)*$/, "Nom invalide");

// schéma du body attendu pour la création d'utilisateur
const UserCreateSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  emailPrivate: z.string().trim().email(),
  password: z.string().min(8),
  isAdmin: z.boolean().optional().default(false),
  mustChangePassword: z.boolean().optional().default(false),
  locationId: z.coerce.number().int().positive(), // accepte un chiffre en string et convertit en number
});

export async function POST(request: Request) {
  try {
    // contrôle d’authentification
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json(
        { success: false, message: "Non authentifié" },
        { status: 401 }
      );
    }

    // lecture du JSON
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants." },
        { status: 400 }
      );
    }

    // validation Zod
    const parsed = UserCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants." },
        { status: 400 }
      );
    }

    // on déstructure les champs validés
    const {
      firstName,
      lastName,
      emailPrivate,
      password,
      isAdmin,
      mustChangePassword,
      locationId,
    } = parsed.data;

    // vérifie que la localisation existe
    const location = await prisma.location.findUnique({
      where: { id: Number(locationId) },
    });
    if (!location) {
      return NextResponse.json(
        { success: false, message: "Localisation inconnue." },
        { status: 400 }
      );
    }

    // contrôle d’accès par groupe :
    // seul un membre du groupe "Gestion.Utilisateurs.*NomLocalisation*" peut créer des utilisateurs pour cette localisation
    const guardGroupName = "Gestion.Utilisateurs." + location.name;

    const guardGroup = await prisma.group.findFirst({
      where: { groupName: guardGroupName, locationId: location.id },
      select: { id: true },
    });
    if (!guardGroup) {
      return NextResponse.json(
        { success: false, message: "Accès refusé." },
        { status: 403 }
      );
    }

    // vérifie que l’utilisateur courant appartient à ce groupe
    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });
    if (!guardMembership) {
      return NextResponse.json(
        { success: false, message: "Accès refusé." },
        { status: 403 }
      );
    }

    // construit l’email pro prenom.nom@ticketease.be
    const emailProfessional = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ticketease.be`;

    // refuse si l’email pro existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { emailProfessional: emailProfessional },
    });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "Cet email existe déjà.",
      });
    }

    // hachage du mot de passe temporaire
    const hashedPassword = await bcrypt.hash(password, 10);

    // création de l’utilisateur
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        emailPrivate: emailPrivate,
        emailProfessional: emailProfessional,
        password: hashedPassword,
        isAdmin: isAdmin,
        mustChangePassword: mustChangePassword,
        locationId: Number(locationId),
      },
    });

    // Si l'option admin a été coché, ajoute l’utilisateur comme admin dans tous les groupes
    if (newUser.isAdmin) {
      const groups = await prisma.group.findMany({ select: { id: true } });

      if (groups.length > 0) {
        await prisma.groupUser.createMany({
          data: groups.map((g) => ({
            userId: newUser.id,
            groupId: g.id,
            isAdmin: true,
          })),
          skipDuplicates: true,
        });

        await prisma.groupUser.updateMany({
          where: { userId: newUser.id },
          data: { isAdmin: true },
        });
      }
    }

    // envoi d’email de bienvenue
    const html = resendEmail(firstName, lastName, emailProfessional, password);
    try {
      await sendEmailHtml(
        emailPrivate,
        "Votre compte TicketEase a été créé",
        html
      );
    } catch (e) {
      console.error("Erreur d'envoi de mail (new-user):", e);
    }

    // réponse OK
    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès.",
    });
  } catch (error) {
    // gestion générique des erreurs serveur
    return NextResponse.json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur.",
    });
  }
}
