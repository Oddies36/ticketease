import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  //On récupère l'email et mot de passe du formulaire frontend
  const { email, password } = await request.json();

  //On va chercher l'utililsateur avec son email
  const user = await prisma.user.findUnique({
    where: { emailProfessional: email },
  });

  //Si l'utilisateur n'existe pas, renvoie une erreur 401
  if (!user) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrecte" },
      { status: 401 }
    );
  }

  //On compare le mot de passe entré avec le mot de passe de la base de données
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrecte" },
      { status: 401 }
    );
  }

  //On signe le token avec le user id et l'email. Il expire après 8h.
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.emailProfessional,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  //On renvoie la réponse et si l'utilisateur doit changer son mot de passe ou pas
  const response = NextResponse.json({
    message: "Connexion réussie",
    mustChangePassword: user.mustChangePassword,
  });

  //on attache le cookie avec le token
  //On peut également utiliser cookies().set({}) ce qui est plus lisible.
  response.headers.append(
    "Set-Cookie",
    `accessToken=${token}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; Path=/; Max-Age=28800; SameSite=Lax;`
  );

  return response;
}
