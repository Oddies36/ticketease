import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, emailPrivate, password, isAdmin, mustChangePassword } = await request.json();

    const emailProfessional = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ticketease.be`;

    const existingUser = await prisma.user.findUnique({
      where: { emailProfessional: emailProfessional },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: "Cet email existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        emailPrivate,
        emailProfessional: emailProfessional,
        password: hashedPassword,
        isAdmin: isAdmin || false,
        mustChangePassword: mustChangePassword || false,
      },
    });

    return NextResponse.json({ success: true, message: "Utilisateur créé avec succès." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur lors de la création de l'utilisateur." });
  }
}