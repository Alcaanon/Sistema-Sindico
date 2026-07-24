import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';

@Injectable()
export class AvaliacoesService {
  private readonly logger = new Logger(AvaliacoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(usuarioId: number, createAvaliacaoDto: CreateAvaliacaoDto) {
    this.logger.debug(`[DEBUG] Iniciando registro de avaliação do tipo ${createAvaliacaoDto.tipo} pelo usuário ID: ${usuarioId}`);

    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuarioExists) {
      this.logger.warn(`[SEGURANÇA] Tentativa de avaliação por usuário inexistente (ID: ${usuarioId}).`);
      throw new NotFoundException(`Usuário ID ${usuarioId} não encontrado.`);
    }

    try {
      const avaliacao = await this.prisma.avaliacaoApp.create({
        data: {
          ...createAvaliacaoDto,
          usuarioId, 
        },
        include: {
          usuario: { select: { nomeCompleto: true, perfil: true } }
        }
      });
      
      this.logger.log(`[AUDITORIA] Nova avaliação registrada. ID: ${avaliacao.id}, Tipo: ${avaliacao.tipo}, Autor: ${avaliacao.usuario.nomeCompleto}`);
      return avaliacao;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao registrar avaliação do usuário ID ${usuarioId}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async findAll(tipo?: 'BUG' | 'SUGESTAO' | 'ELOGIO') {
    this.logger.debug(`[DEBUG] Consultando avaliações. Filtro de tipo: ${tipo || 'Todos'}`);
    return this.prisma.avaliacaoApp.findMany({
      where: {
        ...(tipo && { tipo }),
      },
      orderBy: { dataHora: 'desc' },
      include: {
        usuario: {
          select: { nomeCompleto: true, perfil: true, unidade: { select: { numero: true } } },
        },
      },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes da avaliação ID: ${id}`);
    const avaliacao = await this.prisma.avaliacaoApp.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { nomeCompleto: true, perfil: true, unidade: { select: { numero: true } } },
        },
      },
    });

    if (!avaliacao) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Avaliação ID ${id} não localizada.`);
      throw new NotFoundException(`Avaliação ID ${id} não localizada.`);
    }

    return avaliacao;
  }
}