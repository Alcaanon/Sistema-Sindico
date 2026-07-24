import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManutencaoDto } from './dto/create-manutencao.dto';
import { UpdateManutencaoDto } from './dto/update-manutencao.dto';

@Injectable()
export class ManutencoesService {
  private readonly logger = new Logger(ManutencoesService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  private calcularProximaData(dataUltimaISO: string, mesesIncr: number): Date {
    const data = new Date(dataUltimaISO);
    data.setMonth(data.getMonth() + mesesIncr);
    return data;
  }

  async create(createManutencaoDto: CreateManutencaoDto) {
    this.logger.debug(`[DEBUG] Iniciando cadastro de nova manutenção preventiva: ${createManutencaoDto.descricaoServico}`);
    
    let dataProximoAlerta = null;
    if (createManutencaoDto.dataUltimaExecucao) {
      dataProximoAlerta = this.calcularProximaData(
        createManutencaoDto.dataUltimaExecucao, 
        createManutencaoDto.periodicidadeMeses
      );
    }

    try {
      const manutencao = await this.prisma.manutencaoPreventiva.create({
        data: {
          descricaoServico: createManutencaoDto.descricaoServico,
          periodicidadeMeses: createManutencaoDto.periodicidadeMeses,
          dataUltimaExecucao: createManutencaoDto.dataUltimaExecucao ? new Date(createManutencaoDto.dataUltimaExecucao) : null,
          dataProximoAlerta,
        },
      });
      this.logger.log(`[AUDITORIA] Manutenção ID ${manutencao.id} registrada. Próximo alerta previsto para: ${dataProximoAlerta?.toISOString()}`);
      return manutencao;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao criar manutenção preventiva. Motivo: ${msg}`);
      throw error;
    }
  }

  async findAll() {
    this.logger.debug(`[DEBUG] Listando cronograma de manutenções preventivas.`);
    return this.prisma.manutencaoPreventiva.findMany({
      orderBy: { dataProximoAlerta: 'asc' },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes da manutenção ID: ${id}`);
    const manutencao = await this.prisma.manutencaoPreventiva.findUnique({
      where: { id },
    });

    if (!manutencao) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Manutenção ID ${id} não localizada.`);
      throw new NotFoundException(`Manutenção com ID ${id} não localizada no painel.`);
    }

    return manutencao;
  }

  async update(id: number, updateManutencaoDto: UpdateManutencaoDto) {
    const manutencaoExistente = await this.findOne(id);
    this.logger.debug(`[DEBUG] Solicitada atualização para manutenção ID: ${id}`);
    
    const dataParaAtualizar: any = { ...updateManutencaoDto };

    if (updateManutencaoDto.dataUltimaExecucao) {
      const periodicidade = updateManutencaoDto.periodicidadeMeses || manutencaoExistente.periodicidadeMeses;
      dataParaAtualizar.dataUltimaExecucao = new Date(updateManutencaoDto.dataUltimaExecucao);
      dataParaAtualizar.dataProximoAlerta = this.calcularProximaData(updateManutencaoDto.dataUltimaExecucao, periodicidade);
    }

    try {
      const manutencao = await this.prisma.manutencaoPreventiva.update({
        where: { id },
        data: dataParaAtualizar,
      });
      this.logger.log(`[AUDITORIA] Manutenção ID ${id} atualizada com sucesso. Novo alerta: ${manutencao.dataProximoAlerta?.toISOString()}`);
      return manutencao;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao atualizar manutenção ID ${id}. Motivo: ${msg}`);
      throw error;
    }
  }

  async remove(id: number) {
    this.logger.warn(`[AUDITORIA - ALERTA] Executando exclusão da manutenção ID: ${id}`);
    await this.findOne(id);
    
    try {
      await this.prisma.manutencaoPreventiva.delete({ where: { id } });
      this.logger.log(`[AUDITORIA] Manutenção ID ${id} removida com sucesso.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao remover manutenção ID ${id}. Motivo: ${msg}`);
      throw error;
    }
  }
}