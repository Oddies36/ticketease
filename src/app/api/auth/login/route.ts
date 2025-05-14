import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if(!user) {
        return NextResponse.json({ error: "Email ou mot de passe incorrecte" }, { status: 401 });
    }

    const token = jwt.sign({
        userId: user.id,
        email: user.email
    }, JWT_SECRET, { expiresIn: "1h"});

    return NextResponse.json({ token });
}