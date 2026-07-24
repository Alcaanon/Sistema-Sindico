import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsBoolean, IsOptional, IsEnum, Matches, Min } from 'class-validator';
import { TipoDespesa } from '@prisma/client';

export class CreateDespesaDto {
  @ApiProperty({ description: 'ID do usuário (Síndico) que está registrando a despesa', example: 1 })
  @IsInt()
  @IsNotEmpty()
  cadastradoPorId: number;

  @ApiProperty({ description: 'Mês e ano de referência da despesa (MM/YYYY)', example: '07/2026' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{4}$/, { message: 'O mês de referência deve estar no formato MM/YYYY' })
  @IsNotEmpty()
  mesReferencia: string;

  @ApiProperty({ description: 'Descrição da despesa', example: 'Manutenção preventiva dos elevadores' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ description: 'Valor total da despesa', example: 1200.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  valor: number;

  @ApiProperty({ description: 'Categoria da despesa', enum: TipoDespesa, example: 'MANUTENCAO' })
  @IsEnum(TipoDespesa)
  @IsNotEmpty()
  tipoDespesa: TipoDespesa;

  @ApiPropertyOptional({ description: 'Sinaliza se o valor foi adiantado pelo síndico para futuro reembolso', example: false })
  @IsBoolean()
  @IsOptional()
  pagoPeloSindico?: boolean;

  @ApiPropertyOptional({ description: 'URL ou caminho do arquivo do comprovante digitalizado', example: 'https://storage.com/nota-fiscal-123.pdf' })
  @IsString()
  @IsOptional()
  urlComprovante?: string;

  @ApiPropertyOptional({ description: 'Quantidade de parcelas. Se omitido, será à vista (1).', example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  numeroParcelas?: number;
}