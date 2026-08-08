import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
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

  console.log('Seed terminé : 1 utilisateur par rôle créé ou mis à jour.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
