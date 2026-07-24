import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

interface Morador {
  id?: number;
  nomeCompleto?: string;
  nome?: string;
  perfil?: string;
}

interface Unidade {
  id: number;
  numero: string;
  statusOcupacao: 'PROPRIETARIO' | 'INQUILINO' | 'VAZIO';
  vagaGaragem?: string;
  moradores?: Morador[];
}

@Component({
  selector: 'app-unidades',
  standalone: true,
  imports: [CommonModule, IonContent],
  templateUrl: './unidades.component.html',
  styleUrls: ['./unidades.component.scss'],
})
export class UnidadesComponent {
  private location = inject(Location);
  private router = inject(Router);
private apiService = inject(ApiService);

  public unidades: Unidade[] = [];
  public isLoading = true;

  ionViewWillEnter() {
    this.carregarUnidades();
  }

  private carregarUnidades() {
    this.isLoading = true;

    forkJoin({
      unidadesApi: this.apiService.getUnidades(),
      usuariosApi: this.apiService.getUsuarios()
    }).subscribe({
      next: (dados: any) => {
        
        this.unidades = dados.unidadesApi.map((und: Unidade) => {
          
          const moradoresVinculados = dados.usuariosApi.filter((user: any) => {
            const numeroDaUnidade = user.unidadeNumero || user.unidade_numero || user.unidade?.numero;
            return numeroDaUnidade === und.numero;
          });

          return {
            ...und,
            moradores: moradoresVinculados
          };
        });

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro ao buscar unidades e usuários:', err);
        this.isLoading = false;
      }
    });
  }

  public removerAcessoMorador(morador: Morador) {
    if (morador.perfil === 'SINDICO') {
      alert('Operação negada: Não é possível remover o acesso do Síndico por esta tela.');
      return;
    }
    
    if (!morador.id) {
      alert('Erro: ID do morador não encontrado.');
      return;
    }

    const nome = morador.nomeCompleto || morador.nome || 'Usuário';

    const confirmacao = window.confirm(`Tem certeza que deseja revogar o acesso de ${nome}? Essa ação não pode ser desfeita.`);
    
    if (confirmacao) {
      this.apiService.deletarUsuario(morador.id).subscribe({
        next: () => {
          const acaoLog = `Exclusão de acesso do morador: ${nome} (ID: ${morador.id})`;
          this.apiService.registrarLog(acaoLog).subscribe();

          alert('Acesso removido com sucesso!');
          this.carregarUnidades(); 
        },
        error: (err: any) => {
          console.error('Erro ao remover acesso:', err);
          alert('Erro ao tentar remover o acesso do morador. Tente novamente mais tarde.');
        }
      });
    }
  }

  public getBadgeClasses(status: string): string {
    switch (status) {
      case 'PROPRIETARIO':
        return 'bg-emerald-100 text-emerald-800';
      case 'INQUILINO':
        return 'bg-blue-100 text-blue-800';
      case 'VAZIO':
      default:
        return 'bg-gray-200 text-gray-600';
    }
  }

  public getBadgeText(status: string): string {
    switch (status) {
      case 'PROPRIETARIO': return 'Proprietário';
      case 'INQUILINO': return 'Inquilino';
      case 'VAZIO': return 'Vazio';
      default: return 'Desconhecido';
    }
  }

  public editarUnidade(id: number) {
    this.router.navigate(['/editar-unidade', id]);
  }

  public aprovarMorador() {
    this.router.navigate(['/aprovacoes']);
  }

  public criarAcessoMorador() {
    this.router.navigate(['/cadastro-usuario'], { 
      queryParams: { perfilAcesso: 'MORADOR' } 
    });
  }

  public voltar() {
    this.location.back();
  }
}