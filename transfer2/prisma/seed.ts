import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const items = [
    { label: "Demande de laptop" },
    { label: "Demande de desktop" },
    { label: "Demande de matériel supplémentaire" },
    { label: "Création d'un nouvel utilisateur" },
    { label: "Création d'un nouveau groupe" },
  ];

  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    await prisma.category.upsert({
      where: { label: c.label },
      update: {},
      create: { label: c.label },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
