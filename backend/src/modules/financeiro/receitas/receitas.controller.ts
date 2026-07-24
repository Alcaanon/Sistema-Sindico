import { Controller,   Get,   Post,   Body,   Patch,   Param,   Delete,   Query,   HttpCode,   HttpStatus,   UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReceitasService } from './receitas.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Financeiro - Receitas')
@ApiBearerAuth() 
@UseGuards(JwtAuthGuard, RolesGuard) 
@Controller('receitas')
export class ReceitasController {
  constructor(private readonly receitasService: ReceitasService) {}

  @Post()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Registrar uma nova entrada no caixa (Suporta parcelamento/acordos) - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Receita registrada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode registrar receitas.' })
  @ApiResponse({ status: 404, description: 'Unidade vinculada não encontrada.' })
  create(@Body() createReceitaDto: CreateReceitaDto) {
    return this.receitasService.create(createReceitaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as receitas (Ignora os consolidadores "mãe") - Acesso: Moradores e Síndico' })
  @ApiQuery({ name: 'mesReferencia', required: false, description: 'Filtrar por mês (ex: 07/2026)' })
  @ApiResponse({ status: 200, description: 'Lista de receitas retornada com sucesso.' })
  findAll(@Query('mesReferencia') mesReferencia?: string) {
    return this.receitasService.findAll(mesReferencia);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma receita específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da receita', type: 'number' })
  @ApiResponse({ status: 200, description: 'Receita encontrada.' })
  @ApiResponse({ status: 404, description: 'Receita não localizada.' })
  findOne(@Param('id') id: string) {
    return this.receitasService.findOne(+id);
  }

  @Patch(':id')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Atualizar dados de uma receita registrada - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da receita', type: 'number' })
  @ApiResponse({ status: 200, description: 'Receita atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Nível de acesso insuficiente.' })
  update(@Param('id') id: string, @Body() updateReceitaDto: UpdateReceitaDto) {
    return this.receitasService.update(+id, updateReceitaDto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.SINDICO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir um registro de receita - Restrito: Síndico' })
  @ApiParam({ name: 'id', description: 'ID interno da receita', type: 'number' })
  @ApiResponse({ status: 204, description: 'Receita excluída com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Nível de acesso insuficiente.' })
  remove(@Param('id') id: string) {
    return this.receitasService.remove(+id);
  }
}