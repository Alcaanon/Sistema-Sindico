import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CobrancasService } from './cobrancas.service';
import { PagarCobrancaDto } from './dto/pagar-cobranca.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { NumeroUnidade } from '@prisma/client';

@ApiTags('Financeiro - Cobranças (Rateios)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cobrancas')
export class CobrancasController {
  constructor(private readonly cobrancasService: CobrancasService) {}

  
  @Get()
  @ApiOperation({ summary: 'Listar cobranças geradas - Acesso: Moradores e Síndico', })
  @ApiQuery({ name: 'unidadeNumero', required: false, description: 'Filtrar cobranças de uma unidade específica', enum: NumeroUnidade, })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por PENDENTE ou PAGO', enum: ['PENDENTE', 'PAGO'], })
  @ApiResponse({ status: 200, description: 'Lista de cobranças retornada com sucesso.', })
  findAll( @Request() req, @Query('unidadeNumero') unidadeNumero?: NumeroUnidade, @Query('status') status?: 'PENDENTE' | 'PAGO',
  ) {
    return this.cobrancasService.findAll(
      req.user,
      unidadeNumero,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma cobrança específica - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID da cobrança', type: 'number' })
  @ApiResponse({ status: 200, description: 'Cobrança encontrada.' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.cobrancasService.findOne(req.user, +id);
  }

  @Patch(':id/pagar')
  @ApiOperation({ summary: 'Registrar o pagamento da cota anexando o comprovante PIX - Acesso: Moradores e Síndico' })
  @ApiParam({ name: 'id', description: 'ID da cobrança que está sendo paga', type: 'number' })
  @ApiResponse({ status: 200, description: 'Pagamento registrado e status alterado para PAGO.' })
  @ApiResponse({ status: 400, description: 'Cobrança já consta como paga.' })
  registrarPagamento(@Request() req, @Param('id') id: string, @Body() pagarCobrancaDto: PagarCobrancaDto) {
    return this.cobrancasService.registrarPagamento(req.user,+id, pagarCobrancaDto);
  }
}