import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { json } from "stream/consumers";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {

    const user = await getAuthenticatedUser();

    if(!user){
        return NextResponse.json({error: "Pas d'utilisateur trouvé"}, {status: 401});
    }

    const { password } = await request.json();

    if(!password){
        return NextResponse.json({error: "Pas de mot de passe trouvé"}, {status: 401});
    }

    const hashedPassword = await bcrypt.hash(password, 10);


  try {
    const modifyPassword = await prisma.user.update({
        where: { id: user.id},
        data: {
            password: hashedPassword,
            mustChangePassword: false,
            updatedAt: new Date()
        }
    });

    return NextResponse.json({success: true});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur lors du changement du mot de passe." });
  }
}