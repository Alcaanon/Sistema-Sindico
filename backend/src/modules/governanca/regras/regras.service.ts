import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRegraDto } from './dto/create-regra.dto';
import { UpdateRegraDto } from './dto/update-regra.dto';

@Injectable()
export class RegrasService {
  private readonly logger = new Logger(RegrasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createRegraDto: CreateRegraDto) {
    this.logger.debug(`[DEBUG] Iniciando criação de nova regra no mural.`);
    try {
      const regra = await this.prisma.muralRegras.create({
        data: createRegraDto,
      });
      this.logger.log(`[AUDITORIA] Regra ID ${regra.id} criada com sucesso no mural.`);
      return regra;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao criar regra no mural. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async findAll() {
    this.logger.debug(`[DEBUG] Consultando todas as regras do mural.`);
    return this.prisma.muralRegras.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando regra ID: ${id} no mural.`);
    const regra = await this.prisma.muralRegras.findUnique({
      where: { id },
    });

    if (!regra) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Regra ID ${id} não localizada no mural.`);
      throw new NotFoundException(`Regra com ID ${id} não localizada no mural.`);
    }

    return regra;
  }

  async update(id: number, updateRegraDto: UpdateRegraDto) {
    await this.findOne(id);
    try {
      const regra = await this.prisma.muralRegras.update({
        where: { id },
        data: updateRegraDto,
      });
      this.logger.log(`[AUDITORIA] Regra ID ${id} atualizada com sucesso no mural.`);
      return regra;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao atualizar regra ID ${id}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async remove(id: number) {
    this.logger.warn(`[AUDITORIA - ALERTA] Executando exclusão da regra ID: ${id} do mural.`);
    await this.findOne(id);
    
    try {
      await this.prisma.muralRegras.delete({
        where: { id },
      });
      this.logger.log(`[AUDITORIA] Regra ID ${id} removida com sucesso do mural.`);
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao remover regra ID ${id}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }
}