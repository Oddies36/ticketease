import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, message: "ID de l'utilisateur manquant." });
    }

    const deletedUser = await prisma.user.delete({
      where: { id: parseInt(userId) },
    });

    if (!deletedUser) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé." });
    }

    return NextResponse.json({ success: true, message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression de l'utilisateur." });
  }
}
