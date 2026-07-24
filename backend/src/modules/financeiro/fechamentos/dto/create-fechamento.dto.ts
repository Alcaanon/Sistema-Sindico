import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Matches, IsDateString } from 'class-validator';

export class CreateFechamentoDto {
  @ApiProperty({ description: 'Mês e ano de competência (MM/YYYY)', example: '07/2026' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{4}$/, { message: 'Formato deve ser MM/YYYY' })
  @IsNotEmpty()
  mesAnoCompetencia: string;

  @ApiProperty({ description: 'Saldo que estava no caixa no final do mês passado', example: 1200.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  saldoAnteriorCaixa: number;

  @ApiProperty({ description: 'Valor a ser guardado para o Fundo de Reserva neste mês', example: 100.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  fundoReservaAdicionado: number;

  @ApiProperty({ description: 'Data de vencimento dos boletos/PIX deste fechamento', example: '2026-08-10T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  dataVencimento: string;
}