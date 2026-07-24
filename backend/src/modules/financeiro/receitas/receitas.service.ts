import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';

@Injectable()
export class ReceitasService {
  private readonly logger = new Logger(ReceitasService.name);
  constructor(private readonly prisma: PrismaService) {}

  private calcularProximoMes(mesAtual: string, incremento: number): string {
    let [mes, ano] = mesAtual.split('/').map(Number);
    mes += incremento;
    while (mes > 12) {
      mes -= 12;
      ano++;
    }
    return `${mes.toString().padStart(2, '0')}/${ano}`;
  }

  private adicionarMesesData(dataISO: string, mesesIncr: number): Date {
    const data = new Date(dataISO);
    data.setMonth(data.getMonth() + mesesIncr);
    return data;
  }

  private async validarConsolidacao(mesReferencia: string) {
  const fechamento = await this.prisma.fechamentoMensal.findUnique({
    where: { mesAnoCompetencia: mesReferencia }
  });

  if (fechamento?.statusFechamento === 'CONSOLIDADO') {
    this.logger.warn(`[SEGURANÇA] Tentativa de alteração em mês consolidado: ${mesReferencia}`);
    throw new ConflictException(`O mês de ${mesReferencia} está consolidado e não permite novos lançamentos ou alterações.`);
  }
}

  async create(createReceitaDto: CreateReceitaDto) {
    await this.validarConsolidacao(createReceitaDto.mesReferencia);

    this.logger.debug(`[DEBUG] Iniciando criação de receita para unidade ID: ${createReceitaDto.unidadeId}`);
    const { numeroParcelas = 1, valorRecebido, mesReferencia, dataRecebimento, descricao, unidadeId, ...restData } = createReceitaDto;

    const unidadeExists = await this.prisma.unidade.findUnique({ where: { id: unidadeId } });
    if (!unidadeExists) {
      this.logger.warn(`[SEGURANÇA] Falha ao criar receita: Unidade ID ${unidadeId} não encontrada.`);
      throw new NotFoundException(`Unidade com ID ${unidadeId} não encontrada no sistema.`);
    }

    try {
      if (numeroParcelas === 1) {
        const receita = await this.prisma.receita.create({
          data: { ...restData, unidadeId, mesReferencia, dataRecebimento: new Date(dataRecebimento), descricao, valorRecebido, numeroParcelas: 1, parcelaAtual: 1 },
        });
        this.logger.log(`[AUDITORIA] Receita única registrada. ID: ${receita.id}, Valor: R$${valorRecebido}, Unidade ID: ${unidadeId}`);
        return receita;
      }

      return await this.prisma.$transaction(async (prisma) => {
        const receitaMae = await prisma.receita.create({
          data: { ...restData, unidadeId, mesReferencia, dataRecebimento: new Date(dataRecebimento), descricao: `${descricao} (RECEBIMENTO PARCELADO)`, valorRecebido, numeroParcelas, parcelaAtual: 0 },
        });

        const valorParcelaBase = Number((valorRecebido / numeroParcelas).toFixed(2));
        const diferencaCentavos = Number((valorRecebido - (valorParcelaBase * numeroParcelas)).toFixed(2));

        const parcelasParaCriar = Array.from({ length: numeroParcelas }).map((_, i) => ({
          ...restData,
          unidadeId,
          mesReferencia: this.calcularProximoMes(mesReferencia, i),
          dataRecebimento: this.adicionarMesesData(dataRecebimento, i),
          descricao: `${descricao} (Parcela ${i + 1}/${numeroParcelas})`,
          valorRecebido: i === numeroParcelas - 1 ? Number((valorParcelaBase + diferencaCentavos).toFixed(2)) : valorParcelaBase,
          numeroParcelas,
          parcelaAtual: i + 1,
          receitaPaiId: receitaMae.id,
        }));

        await prisma.receita.createMany({ data: parcelasParaCriar });
        this.logger.log(`[AUDITORIA] Receita parcelada registrada. ID Mãe: ${receitaMae.id}, ${numeroParcelas} parcelas geradas.`);
        return receitaMae;
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao criar receita. Motivo: ${msg}`);
      throw error;
    }
  }

  async findAll(mesReferencia?: string) {
    this.logger.debug(`[DEBUG] Listando receitas. Filtro: ${mesReferencia || 'Todas'}`);
    return this.prisma.receita.findMany({
      where: { ...(mesReferencia && { mesReferencia }), parcelaAtual: { not: 0 } },
      orderBy: { dataRecebimento: 'desc' },
      include: { unidade: { select: { numero: true } } },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando receita ID: ${id}`);
    const receita = await this.prisma.receita.findUnique({
      where: { id },
      include: { unidade: { select: { numero: true } }, receitasFilhas: true },
    });
    if (!receita) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Receita ID ${id} não localizada.`);
      throw new NotFoundException(`Receita com ID ${id} não localizada.`);
    }
    return receita;
  }

  async update(id: number, updateReceitaDto: UpdateReceitaDto) {
    const receita = await this.findOne(id);
    await this.validarConsolidacao(receita.mesReferencia);  
  
    const receitaOriginal = await this.findOne(id);
    const dataAtualizar: any = { ...updateReceitaDto };
    if (updateReceitaDto.dataRecebimento) dataAtualizar.dataRecebimento = new Date(updateReceitaDto.dataRecebimento);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const receitaAtualizada = await prisma.receita.update({ where: { id }, data: dataAtualizar });
        
        if (receitaOriginal.parcelaAtual === 0) {
          const dadosPropagados: any = {};
          if (updateReceitaDto.unidadeId) dadosPropagados.unidadeId = updateReceitaDto.unidadeId;
          if (updateReceitaDto.tipoReceita) dadosPropagados.tipoReceita = updateReceitaDto.tipoReceita;

          if (Object.keys(dadosPropagados).length > 0) {
            await prisma.receita.updateMany({ where: { receitaPaiId: id }, data: dadosPropagados });
            this.logger.log(`[AUDITORIA] Atualização propagada para filhas da receita ID ${id}.`);
          }
        }
        this.logger.log(`[AUDITORIA] Receita ID ${id} atualizada com sucesso.`);
        return receitaAtualizada;
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao atualizar receita ID ${id}. Motivo: ${msg}`);
      throw error;
    }
  }

  async remove(id: number) {
    const receita = await this.findOne(id);
    await this.validarConsolidacao(receita.mesReferencia);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        if (receita.parcelaAtual === 0) {
          await prisma.receita.deleteMany({ where: { receitaPaiId: id } });
          this.logger.log(`[AUDITORIA] Parcelas filhas removidas da receita ID ${id}.`);
        }
        await prisma.receita.delete({ where: { id } });
        this.logger.log(`[AUDITORIA] Receita ID ${id} removida com sucesso.`);
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao remover receita ID ${id}. Motivo: ${msg}`);
      throw error;
    }
  }
}