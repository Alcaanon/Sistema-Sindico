import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, Length, IsBoolean, IsDateString } from 'class-validator';
import { NumeroUnidade, PerfilUsuario } from '@prisma/client';

export class CreateUsuarioDto {

  @ApiProperty({ description: 'ID da unidade habitacional vinculada', enum: NumeroUnidade, example: NumeroUnidade.APTO_101 })
  @IsEnum(NumeroUnidade)
  @IsNotEmpty()
  unidadeNumero: NumeroUnidade;
  
  @ApiProperty({ description: 'Nome completo do usuário', example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  nomeCompleto: string;

  @ApiProperty({ description: 'CPF do usuário (apenas números)', example: '12345678900' })
  @IsString()
  @Length(11, 14)
  @IsNotEmpty()
  cpf: string;

  @ApiPropertyOptional({ description: 'Número de WhatsApp', example: '11999999999' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'E-mail do usuário', example: 'joao@email.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Perfil de acesso no sistema', enum: PerfilUsuario, example: PerfilUsuario.MORADOR })
  @IsEnum(PerfilUsuario)
  @IsNotEmpty()
  perfil: PerfilUsuario;

  @ApiProperty({ description: 'Senha de acesso (será criptografada)', example: 'SenhaForte123!' })
  @IsString()
  @IsNotEmpty()
  senha: string;

  @ApiPropertyOptional({ description: 'Status do aceite da LGPD', example: true })
  @IsBoolean()
  @IsOptional()
  aceiteLgpd?: boolean;

  @ApiPropertyOptional({ description: 'Data do aceite da LGPD (ISO 8601)', example: '2026-07-10T18:00:00Z' })
  @IsDateString()
  @IsOptional()
  dataAceite?: string;
}