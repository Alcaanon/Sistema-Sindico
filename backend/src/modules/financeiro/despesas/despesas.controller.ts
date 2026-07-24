import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, UseGuards, Request} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Financeiro - Despesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) {}

  @Post()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Registrar uma nova despesa do condomínio (Suporta parcelamento) - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Despesa registrada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode registrar despesas.' })
  @ApiResponse({ status: 404, description: 'Usuário autenticado não encontrado.' })
  create( @Request() req, @Body() createDespesaDto: CreateDespesaDto ) {
    return this.despesasService.create(req.user, createDespesaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as despesas do condomínio (Ignora registros "mãe" para evitar duplicidade nas somas) - Acesso: Moradores e Síndico' })
  @ApiQuery({ name: 'mesReferencia', required: false, description: 'Filtrar por mês (ex: 07/2026)' })
  @ApiResponse({status: 200, description: 'Lista de despesas retornada com sucesso.' })
  findAll(@Query('mesReferencia') mesReferencia?: string) {
    return this.despesasService.findAll(mesReferencia);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma despesa específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da despesa', type: Number })
  @ApiResponse({ status: 200, description: 'Despesa encontrada.' })
  @ApiResponse({ status: 404, description: 'Despesa não localizada.' })
  findOne(@Param('id') id: string) {
    return this.despesasService.findOne(+id);
  }

  @Patch(':id')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Atualizar dados de uma despesa (ex.: anexar comprovante ou corrigir informações) - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da despesa', type: Number })
  @ApiResponse({ status: 200, description: 'Despesa atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Nível de acesso insuficiente.' })
  @ApiResponse({ status: 404, description: 'Despesa não localizada.' })
  update( @Param('id') id: string, @Body() updateDespesaDto: UpdateDespesaDto) {
    return this.despesasService.update(+id, updateDespesaDto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.SINDICO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir um registro de despesa - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da despesa', type: Number })
  @ApiResponse({ status: 204, description: 'Despesa excluída com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Nível de acesso insuficiente.' })
  @ApiResponse({ status: 404, description: 'Despesa não localizada.' })
  remove(@Param('id') id: string) {
    return this.despesasService.remove(+id);
  }
} 