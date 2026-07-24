import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonMenu, MenuController } from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-morador',
  standalone: true,
  imports: [CommonModule, IonContent, IonMenu],
  templateUrl: './morador.component.html'
})
export class MoradorComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  public nomeUsuario = 'Carregando...';
  public unidadeUsuario = '...';
  
  public isLoadingCota = true;
  public valorCota = 0;
  public vencimentoCota = '';
  public mesReferencia = '';
  public chavePix = '12.345.678/0001-90';
  
  public isEstimativa = true; 
  public statusPagamento = '';
  public cobrancaIdAtual: number | null = null;
  public isEnviando = false;

  async ionViewWillEnter() {
    await this.carregarDadosUsuario();
    this.carregarDadosPainel();
  }

  public unidadeId: number | null = null; 

  private async carregarDadosUsuario() {
    const userData = await this.authService.getUserData();

    if (!userData) {
      return;
    }

    this.nomeUsuario = userData.nomeCompleto?.split(' ')[0] || 'Morador';
    const numeroUnidade = (userData as any).unidadeNumero;

    if (!numeroUnidade) {
      return;
    }

    this.unidadeUsuario = numeroUnidade.replace('APTO_', 'Apartamento ');

    const mapaUnidades: Record<string, number> = {
      'APTO_101': 1,
      'APTO_102': 2,
      'APTO_201': 3,
      'APTO_202': 4
    };

    this.unidadeId = mapaUnidades[numeroUnidade] ?? null;

    if (!this.unidadeId) {
      return;
    }

    this.carregarDadosPainel();
  }

  private carregarDadosPainel() {
    this.isLoadingCota = true;

    if (!this.unidadeId) {
      this.isLoadingCota = false;
      return;
    }

    forkJoin({
      cobrancas: this.apiService.getCobrancas(),
      resumo: this.apiService.getResumoMesAtual()
    }).subscribe({
      next: ({ cobrancas, resumo }) => {
        const minhasCobrancas = cobrancas.filter(
          c => Number(c.unidadeId) === Number(this.unidadeId)
        );

        minhasCobrancas.sort((a, b) => b.id - a.id);
        const ultimaCobranca = minhasCobrancas[0];

        const mesAtual = (resumo as any).mesReferenciaOriginal;

        if (ultimaCobranca && ultimaCobranca.fechamento?.mesAnoCompetencia === mesAtual) {
          this.isEstimativa = false;
          this.cobrancaIdAtual = ultimaCobranca.id;
          this.statusPagamento = ultimaCobranca.statusPagamento;
          this.valorCota = Number(ultimaCobranca.fechamento?.valorCotaPorUnidade ?? 0);
          this.mesReferencia = `Mês de ${ultimaCobranca.fechamento?.mesAnoCompetencia}`;
          this.vencimentoCota = new Date(ultimaCobranca.fechamento?.dataVencimento ?? '').toLocaleDateString('pt-BR');
        } 
        else if (ultimaCobranca && ultimaCobranca.statusPagamento === 'PAGO') {
          this.isEstimativa = false;
          this.cobrancaIdAtual = null;
          this.statusPagamento = 'PAGO'; 
          this.valorCota = 0;
          this.mesReferencia = 'Status Atual';
          this.vencimentoCota = 'Nenhum rateio pendente para ' + mesAtual;
        }
        else {
          this.isEstimativa = true;
          this.cobrancaIdAtual = null;
          this.statusPagamento = '';
          this.valorCota = Number((resumo as any).totalDespesas ?? 0) / 4;
          this.mesReferencia = 'Prévia de ' + (resumo as any).mesReferencia;
          this.vencimentoCota = 'A definir (Aguardando Fechamento)';
        }

        this.isLoadingCota = false;
      },
      error: (err) => {
        this.isLoadingCota = false;
      }
    });
  }

  public copiarChavePix() {
    navigator.clipboard.writeText(this.chavePix).then(() => {
      alert('Chave PIX copiada com sucesso!');
    });
  }

  public enviarComprovante() {
    if (!this.cobrancaIdAtual) {
      alert('Nenhuma cobrança ativa disponível para pagamento no momento.');
      return;
    }

    const confirmacao = confirm('Confirmar o envio do comprovante de pagamento?');
    if (!confirmacao) return;

    this.isEnviando = true;
    
    const urlComprovanteMock = 'https://link-do-comprovante-simulado.com/comprovante.pdf';
    const dataPagamento = new Date().toISOString();

    this.apiService.registrarPagamentoCobranca(this.cobrancaIdAtual, urlComprovanteMock, dataPagamento).subscribe({
      next: () => {
        const acaoAuditoria = `Sinalizou o pagamento da cota ref. ${this.mesReferencia.replace('Mês de ', '')} (Valor: R$ ${this.valorCota}) via PIX`;

        this.apiService.registrarLog(acaoAuditoria).subscribe({
          next: () => this.finalizarEnvio(),
          error: () => this.finalizarEnvio()
        });
      },
      error: (err) => {
        this.isEnviando = false;
        alert('Erro ao registrar o pagamento. Tente novamente.');
      }
    });
  }

  private finalizarEnvio() {
    this.isEnviando = false;
    alert('Comprovante enviado com sucesso! O pagamento agora consta como PENDENTE DE AVALIAÇÃO para o síndico.');
    this.carregarDadosPainel();
  }

  public abrirMenu(): void {
    this.menuCtrl.open('menu-morador');
  }

  public fecharMenu(): void {
    this.menuCtrl.close('menu-morador');
  }

  public navegarMenu(rota: string): void {
    this.fecharMenu();
    setTimeout(() => {
      this.router.navigate([rota]);
    }, 250);
  }

  public fazerLogout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}