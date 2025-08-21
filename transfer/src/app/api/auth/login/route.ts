import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
        where: { emailProfessional: email }
    });

    if(!user) {
        return NextResponse.json({ error: "Email ou mot de passe incorrecte" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return NextResponse.json(
            { error: "Email ou mot de passe incorrecte" },
            { status: 401 }
        );
    }

    
    const token = jwt.sign({
        userId: user.id,
        email: user.emailProfessional
    }, JWT_SECRET, { expiresIn: "1h"});
    

    const response = NextResponse.json({
        message: "Connexion réussie",
        mustChangePassword: user.mustChangePassword
    });

    response.headers.append(
        "Set-Cookie",
        `accessToken=${token}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; Path=/; Max-Age=3600; SameSite=Lax;`
    );

    return response;
}