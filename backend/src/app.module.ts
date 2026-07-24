import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './modules/cadastros/usuarios/usuarios.module';
import { UnidadesModule } from './modules/cadastros/unidades/unidades.module';
import { DespesasModule } from './modules/financeiro/despesas/despesas.module';
import { ReceitasModule } from './modules/financeiro/receitas/receitas.module';
import { FechamentosModule } from './modules/financeiro/fechamentos/fechamentos.module';
import { CobrancasModule } from './modules/financeiro/cobrancas/cobrancas.module';
import { OcorrenciasModule } from './modules/governanca/ocorrencias/ocorrencias.module';
import { RegrasModule } from './modules/governanca/regras/regras.module';
import { AuditoriaModule } from './modules/governanca/auditoria/auditoria.module';
import { AvaliacoesModule } from './modules/governanca/avaliacoes/avaliacoes.module';
import { ManutencoesModule } from './modules/operacional/manutencoes/manutencoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    UnidadesModule,
    DespesasModule,
    ReceitasModule,
    FechamentosModule,
    CobrancasModule,
    OcorrenciasModule,
    RegrasModule,
    AuditoriaModule,
    AvaliacoesModule,
    ManutencoesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}