import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AvaliacoesService } from './avaliacoes.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Avaliação do App')
@ApiBearerAuth() 
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar feedback, sugestão ou reporte de bug - Acesso: Moradores e Síndico' })
  @ApiResponse({ status: 201, description: 'Avaliação enviada com sucesso.' })
  create(@Body() createAvaliacaoDto: CreateAvaliacaoDto, @Request() req) {
    return this.avaliacoesService.create(req.user.id, createAvaliacaoDto);
  }

  @Get()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Listar todos os feedbacks (Visão gerencial/desenvolvedor) - Restrito: Síndico' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Filtrar por BUG, SUGESTAO ou ELOGIO', enum: ['BUG', 'SUGESTAO', 'ELOGIO'] })
  @ApiResponse({ status: 200, description: 'Lista de avaliações retornada.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico tem acesso a esta listagem.' })
  findAll(@Query('tipo') tipo?: 'BUG' | 'SUGESTAO' | 'ELOGIO') {
    return this.avaliacoesService.findAll(tipo);
  }

  @Get(':id')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Ver detalhes de um feedback específico - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da avaliação', type: 'number' })
  @ApiResponse({ status: 200, description: 'Detalhes da avaliação.' })
  @ApiResponse({ status: 403, description: 'Proibido: Acesso restrito.' })
  @ApiResponse({ status: 404, description: 'Avaliação não localizada.' })
  findOne(@Param('id') id: string) {
    return this.avaliacoesService.findOne(+id);
  }
}