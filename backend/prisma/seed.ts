import { PrismaClient, StatusOcupacao, PerfilUsuario, NumeroUnidade } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Iniciando o Seed do Banco de Dados...');

  const unidades = [NumeroUnidade.APTO_101, NumeroUnidade.APTO_102, NumeroUnidade.APTO_201, NumeroUnidade.APTO_202];
  
  for (const num of unidades) {
    await prisma.unidade.upsert({
      where: { numero: num },
      update: {},
      create: { numero: num, statusOcupacao: StatusOcupacao.VAZIO },
    });
  }

  const unidadeSindico = await prisma.unidade.findUnique({ where: { numero: NumeroUnidade.APTO_101 } });
  const unidadeMorador = await prisma.unidade.findUnique({ where: { numero: NumeroUnidade.APTO_102 } });

  if (unidadeSindico) {
    const senhaPadrao = await bcrypt.hash('Sindico@2026', 10);

    await prisma.usuario.upsert({
      where: { cpf: '00000000000' },
      update: {},
      create: {
        unidadeNumero: unidadeSindico.numero,
        nomeCompleto: 'Jorge Alberto',
        cpf: '00000000000',
        perfil: PerfilUsuario.SINDICO,
        senhaHash: senhaPadrao,
        aceiteLgpd: false,
        dataAceite: new Date(),
      },
    });
    console.log('Seed concluído com sucesso! CPF: 00000000000 | Senha: Sindico@2026');
  }
    if (unidadeMorador) {
    const senhaPadrao = await bcrypt.hash('Morador@2026', 10);

    await prisma.usuario.upsert({
      where: { cpf: '11111111111' },
      update: {},
      create: {
        unidadeNumero: unidadeMorador.numero,
        nomeCompleto: 'Thalis Mateus',
        cpf: '11111111111',
        perfil: PerfilUsuario.MORADOR,
        senhaHash: senhaPadrao,
        aceiteLgpd: false,
        dataAceite: new Date(),
      },
    });
    console.log('Seed concluído com sucesso! CPF: 11111111111 | Senha: Morador@2026');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });