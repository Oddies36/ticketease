import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendEmailHtml, resendEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const me = await getAuthenticatedUser();
    if (!me) {
      return NextResponse.json(
        { success: false, message: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const firstName = body.firstName;
    const lastName = body.lastName;
    const emailPrivate = body.emailPrivate;
    const password = body.password;
    const isAdmin = body.isAdmin || false;
    const mustChangePassword = body.mustChangePassword || false;
    const locationId = body.locationId;

    if (!firstName || !lastName || !emailPrivate || !password || !locationId) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants." },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: Number(locationId) },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, message: "Localisation inconnue." },
        { status: 400 }
      );
    }

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

    const guardMembership = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId: me.id, groupId: guardGroup.id } },
    });

    if (!guardMembership) {
      return NextResponse.json(
        { success: false, message: "Accès refusé." },
        { status: 403 }
      );
    }

    const emailProfessional = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ticketease.be`;

    const existingUser = await prisma.user.findUnique({
      where: { emailProfessional: emailProfessional },
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "Cet email existe déjà.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
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

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès.",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur.",
    });
  }
}
