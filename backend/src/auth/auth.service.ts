import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validarUsuario(cpf: string, senhaLimpa: string) {
    this.logger.log(`[AUDITORIA] Iniciando validação manual de credenciais para o CPF: ${cpf}`);

    const usuario = await this.prisma.usuario.findUnique({
      where: { cpf },
    });

    if (!usuario) {
      this.logger.warn(`[SEGURANÇA] Falha na validação: CPF ${cpf} não cadastrado no sistema.`);
      throw new UnauthorizedException('CPF ou senha inválidos.');
    }

    const senhaValida = await bcrypt.compare(senhaLimpa, usuario.senhaHash);

    if (!senhaValida) {
      this.logger.warn(`[SEGURANÇA] Falha na validação: Senha incorreta fornecida para o CPF: ${cpf}.`);
      throw new UnauthorizedException('CPF ou senha inválidos.');
    }

    this.logger.log(`[AUDITORIA] Usuário ID: ${usuario.id} validado com sucesso.`);
    return usuario;
  }

  async gerarTokens(usuario: any) {
    this.logger.debug(`[DEBUG] Gerando novo par de tokens (Access/Refresh) para o usuário ID: ${usuario.id}`);

    const payload = {
      sub: usuario.id,
      cpf: usuario.cpf,
      perfil: usuario.perfil,
      lgpdAceito: usuario.aceiteLgpd,
      unidade: usuario.unidadeId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { 
        secret: process.env.JWT_ACCESS_SECRET, 
        expiresIn: '15m' 
      }),
      this.jwtService.signAsync(payload, { 
        secret: process.env.JWT_REFRESH_SECRET, 
        expiresIn: '7d' 
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async atualizarRefreshTokenHash(usuarioId: number, refreshToken: string) {
    this.logger.debug(`[DEBUG] Atualizando hash do Refresh Token no banco de dados para o usuário ID: ${usuarioId}`);

    const hash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.usuario.update({
      where: {
        id: usuarioId,
      },
      data: {
        refreshTokenHash: hash,
      },
    });

    this.logger.debug(`[DEBUG] Hash do Refresh Token atualizado com sucesso para o usuário ID: ${usuarioId}`);
  }

  async login(loginDto: any) {
    this.logger.log(`[AUDITORIA] Tentativa de login iniciada para o CPF: ${loginDto.cpf}`);

    const usuario = await this.prisma.usuario.findUnique({ 
      where: { cpf: loginDto.cpf } 
    });

    if (!usuario) {
      this.logger.warn(`[SEGURANÇA] Tentativa de login falhou: CPF ${loginDto.cpf} não encontrado.`);
      throw new UnauthorizedException('CPF ou senha inválidos.');
    }

    const senhaValida = await bcrypt.compare(loginDto.senha, usuario.senhaHash);
    if (!senhaValida) {
      this.logger.warn(`[SEGURANÇA] Tentativa de login falhou: Senha incorreta para o usuário ID: ${usuario.id}.`);
      throw new UnauthorizedException('CPF ou senha inválidos.');
    }

    const tokens = await this.gerarTokens(usuario);
    await this.atualizarRefreshTokenHash(usuario.id, tokens.refreshToken);

    this.logger.log(`[AUDITORIA] Login bem-sucedido. Sessão criada para o usuário ID: ${usuario.id}`);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      usuario: { 
        id: usuario.id, 
        nomeCompleto: usuario.nomeCompleto, 
        perfil: usuario.perfil, 
        aceiteLgpd: usuario.aceiteLgpd, 
        unidadeNumero: usuario.unidadeNumero 
      },
    };
  }

  async logout(usuarioId: number) {
    this.logger.log(`[AUDITORIA] Processando requisição de logout para o usuário ID: ${usuarioId}`);

    await this.prisma.usuario.updateMany({
      where: {
        id: usuarioId,
        refreshTokenHash: {
          not: null,
        },
      },
      data: {
        refreshTokenHash: null,
      },
    });

    this.logger.log(`[AUDITORIA] Logout concluído. Sessões revogadas no banco para o usuário ID: ${usuarioId}`);

    return {
      message: 'Logout realizado com sucesso.',
    };
  }

  async renovarSessao(refreshToken: string) {
    this.logger.log(`[AUDITORIA] Iniciando processo de renovação de sessão por Refresh Token.`);

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      this.logger.debug(`[DEBUG] Refresh Token decodificado com sucesso para o usuário ID: ${payload.sub}`);

      const usuario = await this.prisma.usuario.findUnique({ 
        where: { id: payload.sub } 
      });

      if (!usuario || !usuario.refreshTokenHash) {
        this.logger.warn(`[SEGURANÇA] Renovação negada: Usuário ID ${payload.sub} não encontrado ou sem hash ativo.`);
        throw new UnauthorizedException('Sessão revogada ou inválida.');
      }

      const isTokenValido = await bcrypt.compare(refreshToken, usuario.refreshTokenHash);
      if (!isTokenValido) {
        this.logger.error(`[SEGURANÇA - CRÍTICO] Tentativa de renovação usando um Token de renovação ADULTERADO ou expirado no usuário ID: ${usuario.id}`);
        throw new UnauthorizedException('Token de renovação adulterado.');
      }

      const novosTokens = await this.gerarTokens(usuario);
      await this.atualizarRefreshTokenHash(usuario.id, novosTokens.refreshToken);

      this.logger.log(`[AUDITORIA] Sessão rotacionada e renovada com sucesso para o usuário ID: ${usuario.id}`);

      return novosTokens;
    } catch (error) {
      const message =
      error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`[AUDITORIA] Falha ao renovar sessão. Motivo: ${message}`,);
      throw new UnauthorizedException('Token de renovação expirado ou corrompido. Faça login novamente.',);
    }
  }
}