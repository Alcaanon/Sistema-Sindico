import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOcorrenciaDto } from './dto/create-ocorrencia.dto';
import { UpdateOcorrenciaDto } from './dto/update-ocorrencia.dto';

@Injectable()
export class OcorrenciasService {
  private readonly logger = new Logger(OcorrenciasService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async create(reqUser: any, createOcorrenciaDto: CreateOcorrenciaDto) {
    this.logger.debug(`[DEBUG] Iniciando registro de ocorrência pelo usuário ID: ${reqUser.id}`);
    const autorId = reqUser.id; 

    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id: autorId },
    });

    if (!usuarioExists) {
      this.logger.warn(`[SEGURANÇA] Tentativa de registro de ocorrência por usuário ID ${autorId} não encontrado.`);
      throw new NotFoundException(`Usuário autenticado não encontrado na base de dados.`);
    }

    try {
      const ocorrencia = await this.prisma.ocorrencia.create({
        data: { ...createOcorrenciaDto, usuarioId: autorId },
        include: {
          usuario: { select: { nomeCompleto: true, unidade: { select: { numero: true } } } }
        }
      });
      this.logger.log(`[AUDITORIA] Ocorrência ID ${ocorrencia.id} registrada com sucesso. Assunto: ${ocorrencia.assunto}, Autor: ${ocorrencia.usuario.nomeCompleto}`);
      return ocorrencia;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao criar ocorrência pelo usuário ID ${autorId}. Motivo: ${msg}`);
      throw error;
    }
  }

  async findAll(status?: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO') {
    this.logger.debug(`[DEBUG] Listando ocorrências. Filtro: ${status || 'Todos'}`);
    return this.prisma.ocorrencia.findMany({
      where: { ...(status && { status }) },
      orderBy: { dataHoraAbertura: 'desc' },
      include: {
        usuario: { select: { nomeCompleto: true, unidade: { select: { numero: true } } } }
      }
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes da ocorrência ID: ${id}`);
    const ocorrencia = await this.prisma.ocorrencia.findUnique({
      where: { id },
      include: {
        usuario: { select: { nomeCompleto: true, unidade: { select: { numero: true } } } }
      }
    });

    if (!ocorrencia) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Ocorrência ID ${id} não localizada.`);
      throw new NotFoundException(`Ocorrência com ID ${id} não localizada.`);
    }

    return ocorrencia;
  }

  async updateStatus(id: number, updateOcorrenciaDto: UpdateOcorrenciaDto) {
    this.logger.debug(`[DEBUG] Solicitada atualização de status para a ocorrência ID: ${id}`);
    await this.findOne(id);

    try {
      const ocorrencia = await this.prisma.ocorrencia.update({
        where: { id },
        data: updateOcorrenciaDto,
        include: {
          usuario: { select: { nomeCompleto: true, unidade: { select: { numero: true } } } }
        }
      });
      this.logger.log(`[AUDITORIA] Status da ocorrência ID ${id} atualizado para: ${ocorrencia.status}`);
      return ocorrencia;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao atualizar ocorrência ID ${id}. Motivo: ${msg}`);
      throw error;
    }
  }

  async remove(id: number) {
    this.logger.warn(`[AUDITORIA - ALERTA] Executando exclusão da ocorrência ID: ${id}`);
    await this.findOne(id);
    
    try {
      await this.prisma.ocorrencia.delete({ where: { id } });
      this.logger.log(`[AUDITORIA] Ocorrência ID ${id} removida do sistema.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao remover ocorrência ID ${id}. Motivo: ${msg}`);
      throw error;
    }
  }
}