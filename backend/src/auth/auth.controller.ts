import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';

@ApiTags('Segurança - Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login e obter os Tokens JWT (Access e Refresh)' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'CPF ou senha inválidos.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mata a sessão ativa na base de dados' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Acesso negado.' })
  logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar o Access Token usando o Refresh Token (Não requer estar logado com Access Token)' })
  @ApiResponse({ status: 200, description: 'Novos tokens emitidos com sucesso.' })
  @ApiResponse({ status: 401, description: 'Sessão revogada, token adulterado ou expirado.' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.renovarSessao(refreshTokenDto.refresh_token);
  }
}