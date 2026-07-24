import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createLogDto: CreateLogDto) {
    this.logger.debug(`[DEBUG] Tentativa de gravar registro de auditoria para o usuário ID: ${createLogDto.usuarioId}`);

    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id: createLogDto.usuarioId },
    });

    if (!usuarioExists) {
      this.logger.warn(`[SEGURANÇA] Falha ao gravar log: Usuário ID ${createLogDto.usuarioId} inexistente.`);
      throw new NotFoundException(`Usuário ID ${createLogDto.usuarioId} não encontrado. Falha ao gravar log.`);
    }

    try {
      const log = await this.prisma.logAuditoria.create({
        data: createLogDto,
      });
      this.logger.debug(`[AUDITORIA] Log registrado com sucesso. ID: ${log.id}`);
      return log;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO FATAL] Falha crítica ao persistir registro de auditoria. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async findAll(usuarioId?: number) {
    this.logger.debug(`[DEBUG] Consultando registros de auditoria. Filtro por usuário: ${usuarioId || 'Nenhum'}`);
    return this.prisma.logAuditoria.findMany({
      where: {
        ...(usuarioId && { usuarioId }),
      },
      orderBy: { dataHora: 'desc' },
      include: {
        usuario: {
          select: { nomeCompleto: true, perfil: true },
        },
      },
    });
  }
}