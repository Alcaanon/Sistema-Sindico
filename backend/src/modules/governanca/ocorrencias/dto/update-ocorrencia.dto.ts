import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatusOcorrencia } from '@prisma/client';

export class UpdateOcorrenciaDto {
  @ApiProperty({ description: 'Novo status de tramitação do chamado', enum: StatusOcorrencia, example: StatusOcorrencia.EM_ANALISE })
  @IsEnum(StatusOcorrencia)
  @IsNotEmpty()
  status: StatusOcorrencia;
}