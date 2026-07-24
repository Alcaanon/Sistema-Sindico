import { Controller, Get, Post, Body, Patch, Param, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UnidadesService } from './unidades.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Controle de Unidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Post()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Cadastrar nova unidade habitacional - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Unidade criada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode cadastrar unidades.' })
  @ApiResponse({ status: 409, description: 'Conflito: Numeração de unidade já cadastrada.' })
  create(@Body() createUnidadeDto: CreateUnidadeDto) {
    return this.unidadesService.create(createUnidadeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as unidades do condomínio - Acesso: Moradores e Síndico' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso, incluindo os moradores vinculados.' })
  findAll() {
    return this.unidadesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar dados de uma unidade específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da Unidade', type: 'number' })
  @ApiResponse({ status: 200, description: 'Unidade encontrada.' })
  @ApiResponse({ status: 404, description: 'Unidade não localizada.' })
  findOne(@Param('id') id: string) {
    return this.unidadesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Atualizar ocupação ou vaga de garagem da unidade - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da Unidade', type: 'number' })
  @ApiResponse({ status: 200, description: 'Dados da unidade atualizados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode alterar unidades.' })
  update(@Param('id') id: string, @Body() updateUnidadeDto: UpdateUnidadeDto) {
    return this.unidadesService.update(+id, updateUnidadeDto);
  }
}