import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@Injectable()
export class UnidadesService {
  private readonly logger = new Logger(UnidadesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUnidadeDto: CreateUnidadeDto) {
    this.logger.debug(`[DEBUG] Tentativa de criação de nova unidade: ${createUnidadeDto.numero}`);

    const unidadeExists = await this.prisma.unidade.findUnique({
      where: { numero: createUnidadeDto.numero },
    });

    if (unidadeExists) {
      this.logger.warn(`[SEGURANÇA] Tentativa de cadastro duplicado: Unidade ${createUnidadeDto.numero} já existente.`);
      throw new ConflictException(`A unidade ${createUnidadeDto.numero} já está cadastrada no sistema.`);
    }

    try {
      const novaUnidade = await this.prisma.unidade.create({
        data: createUnidadeDto,
      });
      this.logger.log(`[AUDITORIA] Unidade ${novaUnidade.numero} (ID: ${novaUnidade.id}) criada com sucesso.`);
      return novaUnidade;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao criar unidade ${createUnidadeDto.numero}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async findAll() {
    this.logger.debug(`[DEBUG] Listando todas as unidades cadastradas.`);
    return this.prisma.unidade.findMany({
      orderBy: { numero: 'asc' },
      include: {
        usuarios: {
          select: { id: true, nomeCompleto: true, perfil: true },
        },
      },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes da unidade ID: ${id}`);
    
    const unidade = await this.prisma.unidade.findUnique({
      where: { id },
      include: { usuarios: true },
    });

    if (!unidade) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Unidade ID ${id} não encontrada.`);
      throw new NotFoundException(`Unidade com ID ${id} não encontrada.`);
    }

    return unidade;
  }

  async update(id: number, updateUnidadeDto: UpdateUnidadeDto) {
    this.logger.debug(`[DEBUG] Solicitada atualização para a unidade ID: ${id}`);
    
    await this.findOne(id);

    try {
      const unidadeAtualizada = await this.prisma.unidade.update({
        where: { id },
        data: updateUnidadeDto,
      });
      this.logger.log(`[AUDITORIA] Unidade ID ${id} atualizada com sucesso.`);
      return unidadeAtualizada;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao atualizar unidade ID ${id}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }
}