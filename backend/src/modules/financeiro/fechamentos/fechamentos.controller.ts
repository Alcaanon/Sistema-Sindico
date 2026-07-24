import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FechamentosService } from './fechamentos.service';
import { CreateFechamentoDto } from './dto/create-fechamento.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Financeiro - Fechamentos Mensais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fechamentos')
export class FechamentosController {
  constructor(private readonly fechamentosService: FechamentosService) {}

  @Post('processar')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Processar fechamento do mês e gerar rateio automático para as 4 unidades - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Fechamento processado e cobranças geradas.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico pode processar fechamentos.' })
  @ApiResponse({ status: 409, description: 'Mês de competência já fechado.' })
  processarFechamento(@Body() createFechamentoDto: CreateFechamentoDto) {
    return this.fechamentosService.processarFechamento(createFechamentoDto);
  }

  @Post('consolidar')
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Congelar o mês e bloquear lançamentos retroativos - Restrito: Síndico' })
  @ApiResponse({ status: 200, description: 'Mês consolidado com sucesso.' })
  async consolidar(@Body() body: { mesAnoCompetencia: string }) {
    return await this.fechamentosService.consolidarMes(body.mesAnoCompetencia);
  }

  @Get()
  @ApiOperation({ summary: 'Listar histórico de todos os fechamentos consolidados - Acesso: Moradores e Síndico' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso.' })
  findAll() {
    return this.fechamentosService.findAll();
  }

  @Get('resumo-mes')
  @ApiOperation({ summary: 'Obter resumo financeiro do mês atual', description: 'Calcula dinamicamente a soma de receitas e despesas do mês corrente, ou retorna os dados consolidados caso o mês já esteja fechado.' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumo financeiro retornado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        saldoCaixa: {
          type: 'number',
          example: 2450.00,
          description: 'Saldo consolidado do caixa (Receitas - Despesas)'
        },
        totalReceitas: {
          type: 'number',
          example: 1200.00,
          description: 'Soma total de todas as receitas do mês'
        },
        totalDespesas: {
          type: 'number',
          example: 450.00,
          description: 'Soma total de todas as despesas do mês'
        },
        mesReferencia: {
          type: 'string',
          example: '07/2026',
          description: 'Mês e ano de referência'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Token JWT ausente ou inválido.' 
  })
  async obterResumo() {
    return await this.fechamentosService.obterResumoMesAtual();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes e cobranças de um fechamento específico - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID do fechamento', type: 'number' })
  @ApiResponse({ status: 200, description: 'Detalhes do fechamento retornados.' })
  findOne(@Param('id') id: string) {
    return this.fechamentosService.findOne(+id);
  }
}