import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ManutencoesService } from './manutencoes.service';
import { CreateManutencaoDto } from './dto/create-manutencao.dto';
import { UpdateManutencaoDto } from './dto/update-manutencao.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Operacional - Manutenções Preventivas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manutencoes')
export class ManutencoesController {
  constructor(private readonly manutencoesService: ManutencoesService) {}

  @Post()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Cadastrar uma nova rotina de manutenção preventiva - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Rotina de manutenção criada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode cadastrar manutenções.' })
  create(@Body() createManutencaoDto: CreateManutencaoDto) {
    return this.manutencoesService.create(createManutencaoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar o cronograma de todas as manutenções cadastradas - Acesso: Moradores e Síndico' })
  @ApiResponse({ status: 200, description: 'Cronograma retornado com sucesso (Ordenado pelo vencimento mais próximo).' })
  findAll() {
    return this.manutencoesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma rotina de manutenção específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID da manutenção', type: 'number' })
  @ApiResponse({ status: 200, description: 'Manutenção encontrada.' })
  @ApiResponse({ status: 404, description: 'Manutenção não localizada.' })
  findOne(@Param('id') id: string) {
    return this.manutencoesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Atualizar dados ou registrar que o serviço foi executado (Recalcula a próxima data) - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da manutenção', type: 'number' })
  @ApiResponse({ status: 200, description: 'Manutenção atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode dar baixa em manutenções.' })
  update(@Param('id') id: string, @Body() updateManutencaoDto: UpdateManutencaoDto) {
    return this.manutencoesService.update(+id, updateManutencaoDto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.SINDICO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma rotina de manutenção do sistema - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID da manutenção', type: 'number' })
  @ApiResponse({ status: 204, description: 'Rotina excluída com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Nível de acesso insuficiente.' })
  remove(@Param('id') id: string) {
    return this.manutencoesService.remove(+id);
  }
}