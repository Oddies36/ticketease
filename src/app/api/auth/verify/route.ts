import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// JWT Secret (server-side only)
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ authenticated: false, error: "Pas de token trouvé" });
  }

  try {
    // ✅ Verify JWT on the server using the secret key
    jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Token invalide" });
  }
}