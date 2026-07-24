import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'CPF do usuário para login', example: '12345678900' })
  @IsString()
  @Length(11, 14)
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ description: 'Senha de acesso', example: 'SenhaForte123!' })
  @IsString()
  @IsNotEmpty()
  senha: string;
}