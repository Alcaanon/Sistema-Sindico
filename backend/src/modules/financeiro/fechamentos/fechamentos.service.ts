import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFechamentoDto } from './dto/create-fechamento.dto';

@Injectable()
export class FechamentosService {
  private readonly logger = new Logger(FechamentosService.name);
  constructor(private readonly prisma: PrismaService) {}

  async processarFechamento(createFechamentoDto: CreateFechamentoDto) {
    const { mesAnoCompetencia, saldoAnteriorCaixa, fundoReservaAdicionado, dataVencimento } = createFechamentoDto;
    this.logger.debug(`[DEBUG] Iniciando processamento de fechamento para: ${mesAnoCompetencia}`);

    const fechamentoExists = await this.prisma.fechamentoMensal.findUnique({
      where: { mesAnoCompetencia },
    });

    if (fechamentoExists) {
      this.logger.warn(`[SEGURANÇA] Tentativa de processamento duplicado para ${mesAnoCompetencia}.`);
      throw new ConflictException(`O fechamento para ${mesAnoCompetencia} já foi processado.`);
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const [agregacaoDespesas, agregacaoReceitas] = await Promise.all([
          prisma.despesa.aggregate({ _sum: { valor: true }, where: { mesReferencia: mesAnoCompetencia, parcelaAtual: { not: 0 } } }),
          prisma.receita.aggregate({ _sum: { valorRecebido: true }, where: { mesReferencia: mesAnoCompetencia, parcelaAtual: { not: 0 } } }),
        ]);

        const totalDespesas = Number(agregacaoDespesas._sum.valor || 0);
        const totalReceitas = Number(agregacaoReceitas._sum.valorRecebido || 0);
        const saldoAtualizadoCaixa = saldoAnteriorCaixa + totalReceitas - totalDespesas;
        const valorCotaPorUnidade = Number(((totalDespesas + fundoReservaAdicionado) / 4).toFixed(2));

        const fechamento = await prisma.fechamentoMensal.create({
          data: {
            mesAnoCompetencia, saldoAnteriorCaixa, totalReceitas, totalDespesas, saldoAtualizadoCaixa,
            despesasMesAnterior: 0, comparativoPercentualCustos: 0, fundoReservaAdicionado,
            valorCotaPorUnidade, dataVencimento: new Date(dataVencimento), statusFechamento: 'CONSOLIDADO',
          },
        });

        const unidades = await prisma.unidade.findMany();
        if (unidades.length === 0) {
          throw new NotFoundException('Nenhuma unidade cadastrada para gerar cobranças.');
        }

        await prisma.cobrancaUnidade.createMany({
          data: unidades.map((unidade) => ({
            fechamentoId: fechamento.id,
            unidadeId: unidade.id,
            statusPagamento: 'PENDENTE' as const,
          })),
        });

        this.logger.log(`[AUDITORIA] Fechamento ${mesAnoCompetencia} consolidado. Total Receitas: R$${totalReceitas}, Total Despesas: R$${totalDespesas}, Unidades Geradas: ${unidades.length}`);
        return fechamento;
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha crítica ao processar fechamento ${mesAnoCompetencia}. Motivo: ${msg}`);
      throw error;
    }
  }

  async consolidarMes(mesAnoCompetencia: string) {
    this.logger.debug(`[DEBUG] Consolidando mês: ${mesAnoCompetencia}`);

    const fechamento = await this.prisma.fechamentoMensal.findUnique({
      where: { mesAnoCompetencia },
    });

    if (!fechamento) {
      throw new NotFoundException(`Fechamento para ${mesAnoCompetencia} não encontrado.`);
    }

    return await this.prisma.fechamentoMensal.update({
      where: { id: fechamento.id },
      data: { statusFechamento: 'CONSOLIDADO' },
    });
  }

  async findAll() {
    this.logger.debug(`[DEBUG] Listando histórico de fechamentos.`);
    return this.prisma.fechamentoMensal.findMany({
      orderBy: { id: 'desc' },
      include: { cobrancas: { include: { unidade: { select: { numero: true } } } } }
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes do fechamento ID: ${id}`);
    const fechamento = await this.prisma.fechamentoMensal.findUnique({
      where: { id },
      include: { cobrancas: { include: { unidade: { select: { numero: true } } } } }
    });

    if (!fechamento) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Fechamento ID ${id} não localizado.`);
      throw new NotFoundException(`Fechamento ID ${id} não localizado.`);
    }
    return fechamento;
  }

  async obterResumoMesAtual() {
    const dataAtual = new Date();
    const mesReferencia = `${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;
    this.logger.debug(`[DEBUG] Gerando resumo financeiro em tempo real para: ${mesReferencia}`);

    try {
      const fechamentoOficial = await this.prisma.fechamentoMensal.findUnique({ where: { mesAnoCompetencia: mesReferencia } });

      if (fechamentoOficial?.statusFechamento === 'CONSOLIDADO') {
        this.logger.debug(`[DEBUG] Retornando dados consolidados de ${mesReferencia}.`);
        return {
          saldoCaixa: Number(fechamentoOficial.saldoAtualizadoCaixa || 0),
          totalReceitas: Number(fechamentoOficial.totalReceitas || 0),
          totalDespesas: Number(fechamentoOficial.totalDespesas || 0),
          mesReferencia,
        };
      }

      const [agregadoReceitas, agregadoDespesas] = await Promise.all([
        this.prisma.receita.aggregate({ _sum: { valorRecebido: true }, where: { mesReferencia, parcelaAtual: { not: 0 } } }),
        this.prisma.despesa.aggregate({ _sum: { valor: true }, where: { mesReferencia, parcelaAtual: { not: 0 } } }),
      ]);

      const totalReceitas = Number(agregadoReceitas._sum?.valorRecebido || 0);
      const totalDespesas = Number(agregadoDespesas._sum?.valor || 0);

      return {
        saldoCaixa: Number((totalReceitas - totalDespesas).toFixed(2)),
        totalReceitas,
        totalDespesas,
        mesReferencia,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao gerar resumo financeiro do mês ${mesReferencia}. Motivo: ${msg}`);
      throw error;
    }
  }
}