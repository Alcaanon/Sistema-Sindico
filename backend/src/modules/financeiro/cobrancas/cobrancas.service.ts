import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PagarCobrancaDto } from './dto/pagar-cobranca.dto';
import { NumeroUnidade, PerfilUsuario } from '@prisma/client';

@Injectable()
export class CobrancasService {
  private readonly logger = new Logger(CobrancasService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async getUnidadeDoMorador(usuarioId: number): Promise<NumeroUnidade> {
    const morador = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { unidadeNumero: true },
    });

    if (!morador || !morador.unidadeNumero) {
      this.logger.warn(`[SEGURANÇA] Usuário ID ${usuarioId} tentou acessar financeiro sem unidade vinculada.`);
      throw new ForbiddenException('Usuário não possui unidade vinculada para acessar o financeiro.');
    }
    return morador.unidadeNumero;
  }

  async findAll(reqUser: any, unidadeNumero?: NumeroUnidade, status?: 'PENDENTE' | 'PAGO') {
    this.logger.debug(
      `[DEBUG] Usuário ID ${reqUser.id} listando cobranças. Filtros: unidade=${unidadeNumero}, status=${status}`,
    );

    let filtroUnidade = unidadeNumero;

    if (reqUser.perfil !== PerfilUsuario.SINDICO) {
      filtroUnidade = await this.getUnidadeDoMorador(reqUser.id);
    }

    return this.prisma.cobrancaUnidade.findMany({
      where: {
        ...(filtroUnidade && { unidade: { numero: filtroUnidade } }),
        ...(status && { statusPagamento: status }),
      },
      orderBy: { id: 'desc' },
      include: {
        unidade: { select: { numero: true } },
        fechamento: { select: { mesAnoCompetencia: true, valorCotaPorUnidade: true, dataVencimento: true } },
      },
    });
  }

  async findOne(reqUser: any, id: number) {
    this.logger.debug(`[DEBUG] Usuário ID ${reqUser.id} buscando detalhes da cobrança ID: ${id}`);
    
    const cobranca = await this.prisma.cobrancaUnidade.findUnique({
      where: { id },
      include: {
        unidade: { select: { numero: true } },
        fechamento: { select: { mesAnoCompetencia: true, valorCotaPorUnidade: true, dataVencimento: true } },
      },
    });

    if (!cobranca) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Cobrança ID ${id} não localizada.`);
      throw new NotFoundException(`Cobrança com ID ${id} não localizada.`);
    }

    if (reqUser.perfil !== PerfilUsuario.SINDICO) {
      const unidadeMorador = await this.getUnidadeDoMorador(reqUser.id);
      if (cobranca.unidade.numero !== unidadeMorador) {
        this.logger.error(`[SEGURANÇA - CRÍTICO] Usuário ID ${reqUser.id} tentou acessar cobrança ID ${id} que pertence à unidade ${cobranca.unidade.numero}`);
        throw new ForbiddenException('Acesso negado: Esta cobrança pertence a outra unidade.');
      }
    }

    return cobranca;
  }

  async registrarPagamento(reqUser: any, id: number, pagarCobrancaDto: PagarCobrancaDto) {
    this.logger.debug(`[DEBUG] Iniciando registro de pagamento para cobrança ID: ${id} pelo usuário ID: ${reqUser.id}`);
    
    const cobranca = await this.findOne(reqUser, id);

    if (cobranca.statusPagamento === 'PAGO') {
      this.logger.warn(`[SEGURANÇA] Tentativa de pagamento duplicado na cobrança ID: ${id}`);
      throw new BadRequestException('Esta cobrança já consta como paga no sistema.');
    }

    const dataPagamentoObj = new Date(pagarCobrancaDto.dataPagamento);
    
    const mesCaixa = String(dataPagamentoObj.getMonth() + 1).padStart(2, '0');
    const anoCaixa = dataPagamentoObj.getFullYear();
    const mesReferenciaCaixa = `${mesCaixa}/${anoCaixa}`; 

    try {
      return await this.prisma.$transaction(async (prisma) => {
        
        const cobrancaPaga = await prisma.cobrancaUnidade.update({
          where: { id },
          data: {
            statusPagamento: 'PAGO',
            urlComprovantePix: pagarCobrancaDto.urlComprovantePix,
            dataPagamento: dataPagamentoObj,
          },
          include: {
            unidade: { select: { numero: true } },
            fechamento: { select: { mesAnoCompetencia: true } },
          }
        });

        await prisma.receita.create({
          data: {
            unidadeId: cobranca.unidadeId,
            mesReferencia: mesReferenciaCaixa, 
            descricao: `Cota Condominial - Ref: ${cobranca.fechamento.mesAnoCompetencia} (Unidade ${cobranca.unidade.numero})`,
            valorRecebido: cobranca.fechamento.valorCotaPorUnidade,
            dataRecebimento: dataPagamentoObj,
            tipoReceita: 'COTA_CONDOMINIAL',
            numeroParcelas: 1,
            parcelaAtual: 1,
          }
        });
        
        this.logger.log(`[AUDITORIA] Pagamento registrado. Entrada gerada com sucesso em ${mesReferenciaCaixa}.`);
        
        return cobrancaPaga;
      });

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao registrar pagamento da cobrança ID ${id}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }
}