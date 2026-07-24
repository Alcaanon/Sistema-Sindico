import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum } from 'class-validator';
import { TipoAvaliacao } from '@prisma/client';

export class CreateAvaliacaoDto {
  @ApiProperty({ description: 'Classificação do feedback', enum: TipoAvaliacao, example: TipoAvaliacao.SUGESTAO })
  @IsEnum(TipoAvaliacao)
  @IsNotEmpty()
  tipo: TipoAvaliacao;

  @ApiProperty({ description: 'Nota de 1 a 5 estrelas para a experiência geral', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  nota: number;

  @ApiProperty({ description: 'Relato detalhado do bug ou da sugestão de melhoria', example: 'A tela de cobranças demora para carregar no meu celular Android.' })
  @IsString()
  @IsNotEmpty()
  comentario: string;
}