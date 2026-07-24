import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PerfilUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    this.logger.debug(`[DEBUG] Iniciando tentativa de criação de usuário com CPF: ${createUsuarioDto.cpf}`);
    const { senha, ...userData } = createUsuarioDto;

    const userExists = await this.prisma.usuario.findUnique({
      where: { cpf: userData.cpf },
    });

    if (userExists) {
      this.logger.warn(`[SEGURANÇA] Tentativa de cadastro duplicado: CPF ${userData.cpf} já existente.`);
      throw new ConflictException('Já existe um usuário cadastrado com este CPF.');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      const novoUsuario = await this.prisma.usuario.create({
        data: { ...userData, senhaHash },
      });

      this.logger.log(`[AUDITORIA] Usuário ${novoUsuario.nomeCompleto} (ID: ${novoUsuario.id}) criado com sucesso.`);
      delete novoUsuario.senhaHash;
      return novoUsuario;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao criar usuário CPF ${userData.cpf}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async findAll() {
    this.logger.debug(`[DEBUG] Listando todos os usuários do sistema.`);
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        cpf: true,
        email: true,
        whatsapp: true,
        perfil: true,
        aceiteLgpd: true,
        unidade: { select: { numero: true } }
      },
    });
  }

  async findOne(id: number) {
    this.logger.debug(`[DEBUG] Buscando detalhes do usuário ID: ${id}`);
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { unidade: true },
    });

    if (!usuario) {
      this.logger.warn(`[SEGURANÇA] Consulta falhou: Usuário ID ${id} não encontrado.`);
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    delete usuario.senhaHash;
    return usuario;
  }

  async update(reqUser: any, id: number, updateUsuarioDto: UpdateUsuarioDto) {
    this.logger.debug(`[DEBUG] Usuário ${reqUser.id} solicitou atualização do perfil ID: ${id}`);
    
    if (reqUser.perfil !== PerfilUsuario.SINDICO && reqUser.id !== id) {
      this.logger.warn(`[SEGURANÇA] Acesso negado: Usuário ID ${reqUser.id} tentou alterar dados do usuário ID: ${id}`);
      throw new ForbiddenException('Acesso negado: Você só tem permissão para atualizar os seus próprios dados.');
    }

    await this.findOne(id);

    let dataToUpdate: any = { ...updateUsuarioDto };

    if (updateUsuarioDto.senha) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.senhaHash = await bcrypt.hash(updateUsuarioDto.senha, salt);
      delete dataToUpdate.senha;
    }

    try {
      const usuarioAtualizado = await this.prisma.usuario.update({
        where: { id },
        data: dataToUpdate,
      });
      this.logger.log(`[AUDITORIA] Usuário ID ${id} atualizado com sucesso.`);
      delete usuarioAtualizado.senhaHash;
      return usuarioAtualizado;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao atualizar usuário ID ${id}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }

  async remove(id: number) {
    this.logger.warn(`[AUDITORIA - ALERTA] Executando exclusão do usuário ID: ${id}`);
    await this.findOne(id);
    
    try {
      const usuarioRemovido = await this.prisma.usuario.delete({
        where: { id },
      });
      this.logger.log(`[AUDITORIA] Usuário ID ${id} removido com sucesso.`);
      return usuarioRemovido;
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERRO] Falha ao remover usuário ID ${id}. Motivo: ${mensagemErro}`);
      throw error;
    }
  }
}