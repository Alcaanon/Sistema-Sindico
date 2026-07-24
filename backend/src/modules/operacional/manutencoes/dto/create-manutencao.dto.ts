import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateManutencaoDto {
  @ApiProperty({ description: 'Descrição clara do serviço que precisa ser realizado periodicamente', example: 'Limpeza e desinfecção da caixa d’água' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  descricaoServico: string;

  @ApiProperty({ description: 'A cada quantos meses este serviço deve ser repetido', example: 6 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  periodicidadeMeses: number;

  @ApiPropertyOptional({ description: 'Data em que o serviço foi realizado pela última vez (ISO 8601)', example: '2026-02-10T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  dataUltimaExecucao?: string;
}