import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OcorrenciasService } from './ocorrencias.service';
import { CreateOcorrenciaDto } from './dto/create-ocorrencia.dto';
import { UpdateOcorrenciaDto } from './dto/update-ocorrencia.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Governança - Ocorrências e Ouvidoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ocorrencias')
export class OcorrenciasController {
  constructor(private readonly ocorrenciasService: OcorrenciasService) {}

  @Post()
  @ApiOperation({ summary: 'Abrir um novo chamado/ocorrência no mural - Acesso: Moradores e Síndico' })
  @ApiResponse({ status: 201, description: 'Ocorrência registrada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  create(@Request() req, @Body() createOcorrenciaDto: CreateOcorrenciaDto) {
    return this.ocorrenciasService.create(req.user, createOcorrenciaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as ocorrências (Mural de Transparência) - Acesso: Moradores e Síndico' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status do chamado', enum: ['ABERTO', 'EM_ANALISE', 'RESOLVIDO'] })
  @ApiResponse({ status: 200, description: 'Lista de ocorrências retornada com sucesso.' })
  findAll(@Query('status') status?: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO') {
    return this.ocorrenciasService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma ocorrência específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID da ocorrência', type: 'number' })
  @ApiResponse({ status: 200, description: 'Ocorrência encontrada.' })
  @ApiResponse({ status: 404, description: 'Ocorrência não localizada.' })
  findOne(@Param('id') id: string) {
    return this.ocorrenciasService.findOne(+id);
  }

  @Patch(':id/status')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Atualizar o status de um chamado - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da ocorrência', type: 'number' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode atualizar o status.' })
  updateStatus(@Param('id') id: string, @Body() updateOcorrenciaDto: UpdateOcorrenciaDto) {
    return this.ocorrenciasService.updateStatus(+id, updateOcorrenciaDto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.SINDICO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma ocorrência - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da ocorrência', type: 'number' })
  @ApiResponse({ status: 204, description: 'Ocorrência excluída com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode apagar ocorrências.' })
  remove(@Param('id') id: string) {
    return this.ocorrenciasService.remove(+id);
  }
}