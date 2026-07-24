import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonMenu, MenuController } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService, ResumoFinanceiro } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-sindico',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonMenu],
  templateUrl: './sindico.component.html'
})
export class SindicoComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  public nomeUsuario: string = 'Carregando...';
  public unidadeUsuario: string = 'Carregando...';

  public isLoadingResumo: boolean = true;
  public abaAtiva: 'RESUMO' | 'COBRANCAS' | 'RECEITAS' | 'DESPESAS' = 'RESUMO';

  public resumo: ResumoFinanceiro = {
    saldoCaixa: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    mesReferencia: '...',
    mesReferenciaOriginal: '' 
  };

  public mesFiltroSelecionado: string = '';
  public listaMesesDisponiveis: string[] = [];

  public listaCobrancas: any[] = [];
  public listaReceitas: any[] = [];
  public listaDespesas: any[] = [];

  public mostrarAlertaFechamento: boolean = false;
  public diasParaFimPrazo: number = 0;
  public statusAlerta: 'normal' | 'hoje' | 'atrasado' = 'normal';

  async ionViewWillEnter() {
    this.verificarAlertaFechamento();

    const userData = await this.authService.getUserData();

    if (userData) {
      this.nomeUsuario = userData.nomeCompleto
        ? userData.nomeCompleto.split(' ')[0]
        : 'Síndico';

      const unidadeBanco = (userData as any).unidadeNumero;

      if (unidadeBanco) {
        this.unidadeUsuario = unidadeBanco.replace('APTO_', 'Apartamento ');
      } else {
        this.unidadeUsuario = 'Unidade não vinculada';
      }

    } else {
      this.nomeUsuario = 'Síndico';
      this.unidadeUsuario = 'Unidade não vinculada';
    }

    this.carregarResumoFinanceiro();
  }

  private verificarAlertaFechamento(): void {
    const diaAtual = new Date().getDate();
    const diaLimite = 25;

    if (diaAtual >= 15) {
      this.mostrarAlertaFechamento = true;

      if (diaAtual < diaLimite) {
        this.statusAlerta = 'normal';
        this.diasParaFimPrazo = diaLimite - diaAtual;
      } else if (diaAtual === diaLimite) {
        this.statusAlerta = 'hoje';
        this.diasParaFimPrazo = 0;
      } else {
        this.statusAlerta = 'atrasado';
        this.diasParaFimPrazo = 0;
      }
    } else {
      this.mostrarAlertaFechamento = false;
    }
  }

  private carregarResumoFinanceiro(): void {
    this.isLoadingResumo = true;

    this.apiService.getResumoMesAtual().subscribe({
      next: (dados) => {
        this.resumo = dados;
        this.isLoadingResumo = false;
        
        if (!this.mesFiltroSelecionado && dados.mesReferenciaOriginal) {
          this.mesFiltroSelecionado = dados.mesReferenciaOriginal;
        }

        if (dados.mesReferenciaOriginal) {
          this.gerarOpcoesMeses(dados.mesReferenciaOriginal);
        }

        this.carregarDadosAbaAtiva();
      },
      error: (err) => {
        console.error('Erro ao buscar resumo financeiro', err);
        this.isLoadingResumo = false;
      }
    });
  }

  private recalcularResumoLocal(): void {
    const totalRec = this.listaReceitas.reduce((acc, rec) => acc + Number(rec.valorRecebido || 0), 0);
    
    const totalDesp = this.listaDespesas.reduce((acc, desp) => acc + Number(desp.valor || 0), 0);

    this.resumo.totalReceitas = totalRec;
    this.resumo.totalDespesas = totalDesp;
    this.resumo.saldoCaixa = totalRec - totalDesp;
    
    if (this.mesFiltroSelecionado) {
      this.resumo.mesReferencia = this.mesFiltroSelecionado;
    }
  }

  private carregarDadosAbaAtiva(): void {
    const mesParaConsultar = this.mesFiltroSelecionado || this.resumo.mesReferenciaOriginal;

    if (!mesParaConsultar) return;

    if (this.abaAtiva === 'COBRANCAS') {
      this.apiService.getCobrancas().subscribe(dados => {
        this.listaCobrancas = dados.filter(cob => cob.fechamento?.mesAnoCompetencia === mesParaConsultar);
      });
    } else if (this.abaAtiva === 'RECEITAS') {
      this.apiService.getReceitas(mesParaConsultar).subscribe(dados => {
        this.listaReceitas = dados;
        this.recalcularResumoLocal(); 
      });
    } else if (this.abaAtiva === 'DESPESAS') {
      this.apiService.getDespesas(mesParaConsultar).subscribe(dados => {
        this.listaDespesas = dados;
        this.recalcularResumoLocal();
      });
    } else {
      forkJoin({
        receitas: this.apiService.getReceitas(mesParaConsultar),
        despesas: this.apiService.getDespesas(mesParaConsultar)
      }).subscribe(({ receitas, despesas }) => {
        this.listaReceitas = receitas;
        this.listaDespesas = despesas;
        this.recalcularResumoLocal();
      });
    }
  }

  public onMudarFiltroMes(novoMes: string): void {
    this.mesFiltroSelecionado = novoMes;
    this.carregarDadosAbaAtiva();
  }

  private gerarOpcoesMeses(mesAtual: string): void {
    if (!mesAtual || !mesAtual.includes('/')) return;
    
    const [mStr, aStr] = mesAtual.split('/');
    const mesBase = parseInt(mStr, 10);
    const anoBase = parseInt(aStr, 10);

    const lista: string[] = [];

    let mesCorrente = mesBase + 6;
    let anoCorrente = anoBase;

    if (mesCorrente > 12) {
      mesCorrente -= 12;
      anoCorrente++;
    }

    for (let i = 0; i < 18; i++) {
      const mesFmt = String(mesCorrente).padStart(2, '0');
      lista.push(`${mesFmt}/${anoCorrente}`);
      
      mesCorrente--;
      if (mesCorrente < 1) {
        mesCorrente = 12;
        anoCorrente--;
      }
    }
    
    this.listaMesesDisponiveis = lista;
  }

  public trocarAba(aba: 'RESUMO' | 'COBRANCAS' | 'RECEITAS' | 'DESPESAS'): void {
    this.abaAtiva = aba;
    this.carregarDadosAbaAtiva();
  }

  public confirmarPagamentoCobranca(id: number): void {
    const confirmacao = window.confirm(
      'Deseja confirmar o pagamento desta unidade? O valor será injetado automaticamente como Receita no caixa do condomínio.'
    );

    if (!confirmacao) return;

    const dataPagamento = new Date().toISOString();
    const urlComprovantePix = 'Baixa manual via painel do Síndico';

    this.apiService.registrarPagamentoCobranca(id, urlComprovantePix, dataPagamento).subscribe({
      next: () => {
        alert('Pagamento confirmado com sucesso!');
        this.carregarDadosAbaAtiva();
        this.carregarResumoFinanceiro();
      },
      error: (err) => {
        alert('Erro ao processar pagamento: ' + (err.error?.message || 'Falha desconhecida.'));
      }
    });
  }

  public isLancamentoEditavel(mesRefLancamento: string): boolean {
    if (!this.resumo.mesReferenciaOriginal) return false;
    return mesRefLancamento === this.resumo.mesReferenciaOriginal;
  }

  public novoLancamento(tipo: 'RECEITA' | 'DESPESA', id?: number): void {
    const queryParams: any = { tipo };

    if (id) {
      queryParams.id = id;
    }

    if (this.resumo.mesReferenciaOriginal) {
      const [mes, ano] = this.resumo.mesReferenciaOriginal.split('/');
      queryParams.minDate = `${ano}-${mes}-01`;
    }

    this.router.navigate(['/lancamento'], { queryParams });
  }

  public excluirLancamento(id: number, tipo: 'RECEITA' | 'DESPESA'): void {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir esta ${tipo.toLowerCase()}?`
    );

    if (!confirmacao) {
      return;
    }

    if (tipo === 'RECEITA') {
      this.apiService.deletarReceita(id).subscribe({
        next: () => {
          this.listaReceitas = this.listaReceitas.filter(r => r.id !== id);
          this.carregarResumoFinanceiro();
        },
        error: () => {
          alert('Erro ao excluir a receita.');
        }
      });
    } else {
      this.apiService.deletarDespesa(id).subscribe({
        next: () => {
          this.listaDespesas = this.listaDespesas.filter(d => d.id !== id);
          this.carregarResumoFinanceiro();
        },
        error: () => {
          alert('Erro ao excluir a despesa.');
        }
      });
    }
  }

  public irParaRateio(): void {
    if (this.isLoadingResumo) {
      alert('Aguarde o carregamento do resumo financeiro.');
      return;
    }

    if (this.resumo.totalDespesas <= 0) {
      alert('Não há despesas cadastradas neste mês para realizar o rateio.');
      return;
    }

    this.router.navigate(['/rateio']);
  }

  public async abrirMenu() {
    try {
      await this.menuCtrl.enable(true, 'menu-sindico');
      await this.menuCtrl.open('menu-sindico');
    } catch (error) {
    }
  }

  public async fecharMenu() {
    await this.menuCtrl.close('menu-sindico');
  }

  public navegarMenu(rota: string): void {
    this.fecharMenu();
    setTimeout(() => {
      this.router.navigate([rota]);
    }, 250);
  }

  public agendarManutencao() {
    this.router.navigate(['/manutencoes']);
  }

  public fazerLogout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}