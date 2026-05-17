import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const usuarios = [
    {
      email: process.env.SEED_USER_1_EMAIL ?? 'admin@preca.local',
      senha: process.env.SEED_USER_1_SENHA ?? 'admin123',
      nome: process.env.SEED_USER_1_NOME ?? 'Administrador',
    },
    {
      email: process.env.SEED_USER_2_EMAIL ?? 'analista@preca.local',
      senha: process.env.SEED_USER_2_SENHA ?? 'analista123',
      nome: process.env.SEED_USER_2_NOME ?? 'Analista',
    },
  ];

  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { nome: u.nome, senhaHash },
      create: { email: u.email, nome: u.nome, senhaHash },
    });
    console.log(`✓ Usuário ${u.email} sincronizado`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
