import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class PagarCobrancaDto {
  @ApiProperty({ description: 'URL ou caminho do arquivo do comprovante PIX digitalizado', example: 'https://storage.com/pix-apto101-ago2026.pdf' })
  @IsString()
  @IsNotEmpty()
  urlComprovantePix: string;

  @ApiProperty({ description: 'Data exata em que a transferência foi realizada', example: '2026-08-05T14:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  dataPagamento: string;
}