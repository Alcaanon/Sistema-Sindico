import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { NumeroUnidade, StatusOcupacao } from '@prisma/client';

export class CreateUnidadeDto {
  @ApiProperty({ description: 'Numeração fixa da unidade', enum: NumeroUnidade, example: NumeroUnidade.APTO_101 })
  @IsEnum(NumeroUnidade)
  @IsNotEmpty()
  numero: NumeroUnidade;

  @ApiProperty({ description: 'Status atual de ocupação', enum: StatusOcupacao, example: StatusOcupacao.PROPRIETARIO })
  @IsEnum(StatusOcupacao)
  @IsNotEmpty()
  statusOcupacao: StatusOcupacao;

  @ApiPropertyOptional({ description: 'Identificação da vaga de garagem vinculada', example: 'Vaga 01 - Térreo' })
  @IsString()
  @IsOptional()
  vagaGaragem?: string;
}