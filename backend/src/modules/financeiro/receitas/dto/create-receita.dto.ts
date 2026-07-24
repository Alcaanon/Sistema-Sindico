import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, IsEnum, Matches, Min, IsDateString } from 'class-validator';
import { TipoReceita } from '@prisma/client';

export class CreateReceitaDto {
  @ApiProperty({ description: 'ID da unidade habitacional que gerou a receita', example: 1 })
  @IsInt()
  @IsNotEmpty()
  unidadeId: number;

  @ApiProperty({ description: 'Mês e ano de referência da receita (MM/YYYY)', example: '07/2026' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{4}$/, { message: 'O mês de referência deve estar no formato MM/YYYY' })
  @IsNotEmpty()
  mesReferencia: string;

  @ApiProperty({ description: 'Descrição da entrada de caixa', example: 'Pagamento de Acordo - Taxa Extra' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ description: 'Valor financeiro recebido', example: 500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  valorRecebido: number;

  @ApiProperty({ description: 'Data em que o valor entrou na conta (ISO 8601)', example: '2026-07-15T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  dataRecebimento: string;

  @ApiProperty({ description: 'Categoria da receita', enum: TipoReceita, example: TipoReceita.OUTROS })
  @IsEnum(TipoReceita)
  @IsNotEmpty()
  tipoReceita: TipoReceita;

  @ApiPropertyOptional({ description: 'Quantidade de parcelas do acordo/recebimento. Se omitido, será à vista (1).', example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  numeroParcelas?: number;
}