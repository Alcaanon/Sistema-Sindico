import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RegrasService } from './regras.service';
import { CreateRegraDto } from './dto/create-regra.dto';
import { UpdateRegraDto } from './dto/update-regra.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Governança - Mural de Regras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regras')
export class RegrasController {
  constructor(private readonly regrasService: RegrasService) {}

  @Post()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Adicionar uma nova regra ao regimento do condomínio - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Regra adicionada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode adicionar regras.' })
  create(@Body() createRegraDto: CreateRegraDto) {
    return this.regrasService.create(createRegraDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as regras documentadas oficialmente - Acesso: Moradores e Síndico' })
  @ApiResponse({ status: 200, description: 'Mural de regras retornado com sucesso.' })
  findAll() {
    return this.regrasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar os detalhes de uma regra específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID da regra', type: 'number' })
  @ApiResponse({ status: 200, description: 'Regra encontrada.' })
  @ApiResponse({ status: 404, description: 'Regra não localizada.' })
  findOne(@Param('id') id: string) {
    return this.regrasService.findOne(+id);
  }

  @Patch(':id')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Atualizar ou corrigir o texto de uma regra existente - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da regra', type: 'number' })
  @ApiResponse({ status: 200, description: 'Regra atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode alterar regras.' })
  update(@Param('id') id: string, @Body() updateRegraDto: UpdateRegraDto) {
    return this.regrasService.update(+id, updateRegraDto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.SINDICO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma regra revogada do mural - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da regra', type: 'number' })
  @ApiResponse({ status: 204, description: 'Regra excluída com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode excluir regras.' })
  remove(@Param('id') id: string) {
    return this.regrasService.remove(+id);
  }
}