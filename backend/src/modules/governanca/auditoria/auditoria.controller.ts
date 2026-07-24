import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { CreateLogDto } from './dto/create-log.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { PerfilUsuario } from '@prisma/client';

@ApiTags('Governança - Auditoria e Logs')
@ApiBearerAuth() 
@UseGuards(JwtAuthGuard, RolesGuard) 
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Registrar uma nova ação no log do sistema (Uso interno) - Restrito: Síndico' })
  @ApiResponse({ status: 201, description: 'Log registrado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Nível de acesso insuficiente.' })
  create(@Body() createLogDto: CreateLogDto) {
    return this.auditoriaService.create(createLogDto);
  }

  @Get()
  @Roles(PerfilUsuario.SINDICO)
  @ApiOperation({ summary: 'Listar o histórico de ações realizadas no sistema - Restrito: Síndico' })
  @ApiQuery({ name: 'usuarioId', required: false, description: 'Filtrar logs por um usuário específico', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lista de logs retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Proibido: Apenas o Síndico tem permissão de auditoria.' })
  findAll(@Query('usuarioId') usuarioId?: string) {
    return this.auditoriaService.findAll(usuarioId ? +usuarioId : undefined);
  }
}