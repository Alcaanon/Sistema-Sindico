import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

export class CreateLogDto {
  @ApiProperty({ description: 'ID do usuário que realizou a ação no sistema', example: 1 })
  @IsInt()
  @IsNotEmpty()
  usuarioId: number;

  @ApiProperty({ description: 'Descrição técnica da ação executada', example: 'Excluiu a despesa ID 45' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  acao: string;
}