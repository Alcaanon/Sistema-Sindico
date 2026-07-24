import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';

@Injectable()
export class DespesasService {
  private readonly logger = new Logger(DespesasService.name);
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

  private async validarConsolidacao(mesReferencia: string) {
    const fechamento = await this.prisma.fechamentoMensal.findUnique({
      where: { mesAnoCompetencia: mesReferencia }
    });

    if (fechamento?.statusFechamento === 'CONSOLIDADO') {
      this.logger.warn(`[SEGURANÇA] Tentativa de alteração em mês consolidado: ${mesReferencia}`);
      throw new ConflictException(`O mês de ${mesReferencia} está consolidado e não permite novos lançamentos ou alterações.`);
    }
  }

  async create(reqUser: any, createDespesaDto: CreateDespesaDto) {
    await this.validarConsolidacao(createDespesaDto.mesReferencia);
    
    this.logger.debug(`[DEBUG] Usuário ID ${reqUser.id} iniciando cadastro de despesa: ${createDespesaDto.descricao}`);
    const { numeroParcelas = 1, valor, mesReferencia, descricao, ...restData } = createDespesaDto;
    const cadastradoPorId = reqUser.id;

    const usuario = await this.prisma.usuario.findUnique({ where: { id: cadastradoPorId } });
    if (!usuario) {
      this.logger.warn(`[SEGURANÇA] Falha ao cadastrar despesa: Usuário ID ${cadastradoPorId} não encontrado.`);
      throw new NotFoundException(`Usuário com ID ${cadastradoPorId} não encontrado.`);
    }

    if (numeroParcelas === 1) {
      try {
        const despesa = await this.prisma.despesa.create({
          data: { ...restData, cadastradoPorId, mesReferencia, descricao, valor, numeroParcelas: 1, parcelaAtual: 1 },
        });
        this.logger.log(`[AUDITORIA] Despesa à vista registrada. ID: ${despesa.id}, Valor: R$${valor}, Ref: ${mesReferencia}`);
        return despesa;
      } catch (error) {
        this.logger.error(`[ERRO] Falha ao criar despesa à vista. Motivo: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const despesaMae = await prisma.despesa.create({
        data: { ...restData, cadastradoPorId, mesReferencia, descricao: `${descricao} (DESPESA PARCELADA)`, valor, numeroParcelas, parcelaAtual: 0 },
      });

      const valorParcela = Number((valor / numeroParcelas).toFixed(2));
      const parcelas = Array.from({ length: numeroParcelas }).map((_, i) => ({
        ...restData,
        cadastradoPorId,
        mesReferencia: this.calcularProximoMes(mesReferencia, i),
        descricao: `${descricao} (Parcela ${i + 1}/${numeroParcelas})`,
        valor: valorParcela,
        numeroParcelas,
        parcelaAtual: i + 1,
        despesaPaiId: despesaMae.id,
      }));

      await prisma.despesa.createMany({ data: parcelas });
      this.logger.log(`[AUDITORIA] Despesa parcelada registrada. ID Mãe: ${despesaMae.id}, ${numeroParcelas} parcelas de R$${valorParcela}.`);
      return despesaMae;
    });
  }

  async findAll(mesReferencia?: string) {
    this.logger.debug(`[DEBUG] Consultando despesas. Filtro: ${mesReferencia || 'Todos'}`);
    return this.prisma.despesa.findMany({
      where: { ...(mesReferencia && { mesReferencia }), parcelaAtual: { not: 0 } },
      orderBy: { id: 'desc' },
      include: { cadastradoPor: { select: { nomeCompleto: true, perfil: true } } },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes da despesa ID: ${id}`);
    const despesa = await this.prisma.despesa.findUnique({
      where: { id },
      include: { cadastradoPor: { select: { nomeCompleto: true, perfil: true } }, despesasFilhas: true },
    });

    if (!despesa) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Despesa ID ${id} não localizada.`);
      throw new NotFoundException(`Despesa com ID ${id} não localizada.`);
    }
    return despesa;
  }

  async update(id: number, updateDespesaDto: UpdateDespesaDto) {
    const despesa = await this.findOne(id);
    await this.validarConsolidacao(despesa.mesReferencia);

    await this.findOne(id);
    try {
      const despesa = await this.prisma.despesa.update({ where: { id }, data: updateDespesaDto });
      this.logger.log(`[AUDITORIA] Despesa ID ${id} atualizada com sucesso.`);
      return despesa;
    } catch (error) {
      this.logger.error(`[ERRO] Falha ao atualizar despesa ID ${id}. Motivo: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async remove(id: number) {
    const despesa = await this.findOne(id);
    await this.validarConsolidacao(despesa.mesReferencia);

    await this.findOne(id);
    try {
      await this.prisma.despesa.delete({ where: { id } });
      this.logger.log(`[AUDITORIA] Despesa ID ${id} removida do sistema.`);
    } catch (error) {
      this.logger.error(`[ERRO] Falha ao remover despesa ID ${id}. Motivo: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}