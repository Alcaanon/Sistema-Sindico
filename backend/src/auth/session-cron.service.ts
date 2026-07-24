import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionCronService {
  private readonly logger = new Logger(SessionCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async limparSessoesAntigas() {
    this.logger.log('Iniciando varredura de segurança: Limpeza de Refresh Tokens inativos...');

    try {
      const usuariosLogados = await this.prisma.usuario.count({
        where: { refreshTokenHash: { not: null } }
      });

      this.logger.log(`Varredura concluída. ${usuariosLogados} sessões ativas detectadas.`);
    } catch (error) {
      this.logger.error('Erro ao executar varredura de segurança.', error);
    }
  }
}