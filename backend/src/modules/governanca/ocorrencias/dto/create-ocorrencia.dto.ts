import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateOcorrenciaDto {
  @ApiProperty({ description: 'ID do usuário (morador ou síndico) que está abrindo o chamado', example: 2 })
  @IsInt()
  @IsNotEmpty()
  usuarioId: number;

  @ApiProperty({ description: 'Assunto da ocorrência, reclamação ou sugestão', example: 'Lâmpada queimada no corredor do 2º andar' })
  @IsString()
  @IsNotEmpty()
  assunto: string;
  
  @ApiProperty({ description: 'Relato detalhado da ocorrência, reclamação ou sugestão', example: 'A lâmpada do corredor do 2º andar está queimada desde ontem.' })
  @IsString()
  @IsNotEmpty()
  descricao: string;
}