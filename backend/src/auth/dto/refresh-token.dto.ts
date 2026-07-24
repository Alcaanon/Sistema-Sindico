import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'O Refresh Token de longa duração recebido durante o login', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  @IsString({ message: 'O token deve ser uma string de texto.' })
  @IsNotEmpty({ message: 'O refresh_token não pode estar vazio.' })
  refresh_token: string;
}