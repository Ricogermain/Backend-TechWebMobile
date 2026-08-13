import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DIRECT_URL ou DATABASE_URL doit être défini pour le seed.');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = [
    {
      role: Role.CLIENT,
      nom: 'Client Seed',
      email: 'client@example.com',
      telephone: '0612345678',
    },
    {
      role: Role.ADMIN,
      nom: 'Admin Seed',
      email: 'admin@example.com',
      telephone: '0698765432',
    },
    {
      role: Role.LIVREUR,
      nom: 'Livreur Seed',
      email: 'livreur@example.com',
      telephone: '0678123456',
    },
  ];

  for (const user of users) {
    await prisma.utilisateur.upsert({
      where: { email: user.email },
      update: {
        nom: user.nom,
        role: user.role,
        telephone: user.telephone,
        motDePasse: passwordHash,
      },
      create: {
        nom: user.nom,
        email: user.email,
        motDePasse: passwordHash,
        telephone: user.telephone,
        role: user.role,
      },
    });
  }

  // These images are bundled with the Flutter application. The `asset:`
  // prefix lets the mobile client display them without an external image host.
  const vehicules = [
    {
      marque: 'Tesla',
      modele: 'Model 3',
      annee: 2024,
      prix: 85000000,
      stock: 3,
      disponible: true,
      imageUrl: 'asset:catalogue/voiture1.png',
    },
    {
      marque: 'BMW',
      modele: 'X5',
      annee: 2023,
      prix: 95000000,
      stock: 2,
      disponible: true,
      imageUrl: 'asset:catalogue/voiture2.png',
    },
    {
      marque: 'Mercedes-Benz',
      modele: 'Classe C',
      annee: 2024,
      prix: 78000000,
      stock: 4,
      disponible: true,
      imageUrl: 'asset:catalogue/voiture3.png',
    },
    {
      marque: 'Toyota',
      modele: 'RAV4',
      annee: 2024,
      prix: 62000000,
      stock: 5,
      disponible: true,
      imageUrl: 'asset:catalogue/voiture4.png',
    },
    {
      marque: 'Porsche',
      modele: '911 Carrera',
      annee: 2023,
      prix: 99000000,
      stock: 1,
      disponible: true,
      imageUrl: 'asset:catalogue/voiture5.png',
    },
  ];

  for (const vehicule of vehicules) {
    const existing = await prisma.vehicule.findFirst({
      where: {
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee,
      },
    });
    if (existing) {
      await prisma.vehicule.update({
        where: { id: existing.id },
        data: vehicule,
      });
    } else {
      await prisma.vehicule.create({ data: vehicule });
    }
  }

  console.log(
    'Seed terminé : utilisateurs et 5 véhicules de catalogue créés ou mis à jour.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
