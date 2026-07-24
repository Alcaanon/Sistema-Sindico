import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRegraDto {
  @ApiProperty({ description: 'Título claro e objetivo da regra', example: 'Horário de Silêncio e Obras' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  tituloRegra: string;

  @ApiProperty({ description: 'Descrição detalhada, penalidades ou exceções da regra', example: 'Obras permitidas apenas de segunda a sexta, das 08h às 17h. Silêncio absoluto após as 22h.' })
  @IsString()
  @IsNotEmpty()
  descricaoDetalhada: string;
}