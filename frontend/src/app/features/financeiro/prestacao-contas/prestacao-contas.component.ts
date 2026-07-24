import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface Fechamento {
  id: number;
  mesAnoCompetencia: string; 
  totalReceitas: number;
  totalDespesas: number;
  fundoReservaAdicionado: number;
  saldoAtualizadoCaixa: number;
  dataFechamento: string;
}

@Component({
  selector: 'app-prestacao-contas',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent],
  templateUrl: './prestacao-contas.component.html'
})
export class PrestacaoContasComponent {
  private location = inject(Location);
  private apiService = inject(ApiService);

  public visaoAtual: 'MENSAL' | 'ANUAL' = 'MENSAL';
  public isLoading = true;
  
  public mesReferenciaAPI = '';
  public listaMesesDisponiveis: string[] = [];
  public isConsolidado = false;
  public fechamentoAtual: Fechamento | null = null;
  public listaDespesas: any[] = [];
  public listaReceitas: any[] = [];
  public totalReceitasCalc = 0;
  public totalDespesasCalc = 0;
  public saldoProjetado = 0;
  public totalCotas = 0; 

  public anoSelecionadoAPI = '';
  public listaAnosDisponiveis: string[] = [];
  public totalReceitasAno = 0;
  public totalDespesasAno = 0;
  public saldoAno = 0;
  public mesesDoAno: any[] = []; 

  ionViewWillEnter() {
    this.carregarResumoInicial();
  }

  private carregarResumoInicial() {
    this.isLoading = true;

    this.apiService.getResumoMesAtual().subscribe({
      next: (resumo) => {
        const mesAtual = resumo.mesReferenciaOriginal || '';
        this.mesReferenciaAPI = mesAtual;

        if (mesAtual) {
          this.gerarOpcoesMeses(mesAtual);
          const anoBase = parseInt(mesAtual.split('/')[1], 10);
          this.gerarOpcoesAnos(anoBase);
        }

        this.apiService.getUnidades().subscribe((unidades) => {
          this.totalCotas = unidades.length > 0 ? unidades.length : 1;
        });

        if (this.mesReferenciaAPI) {
          this.carregarDadosDoMes(this.mesReferenciaAPI);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erro ao iniciar prestação de contas:', err);
        this.isLoading = false;
      }
    });
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

  private gerarOpcoesAnos(anoAtual: number): void {
    this.listaAnosDisponiveis = [
      String(anoAtual + 1),
      String(anoAtual),
      String(anoAtual - 1),
      String(anoAtual - 2)
    ];
    this.anoSelecionadoAPI = String(anoAtual);
  }

  public alterarVisao(visao: 'MENSAL' | 'ANUAL') {
    this.visaoAtual = visao;
    if (visao === 'ANUAL') {
      this.carregarDadosDoAno(this.anoSelecionadoAPI);
    } else {
      this.carregarDadosDoMes(this.mesReferenciaAPI);
    }
  }

  public onMesChange() {
    this.carregarDadosDoMes(this.mesReferenciaAPI);
  }

  public onAnoChange() {
    this.carregarDadosDoAno(this.anoSelecionadoAPI);
  }

  private carregarDadosDoMes(mesCompetencia: string) {
    this.isLoading = true;

    forkJoin({
      receitas: this.apiService.getReceitas(mesCompetencia),
      despesas: this.apiService.getDespesas(mesCompetencia),
      historico: this.apiService.getHistoricoFechamentos()
    }).subscribe({
      next: ({ receitas, despesas, historico }) => {
        this.listaReceitas = Array.isArray(receitas) ? receitas : ((receitas as any).data || []);
        this.listaDespesas = Array.isArray(despesas) ? despesas : ((despesas as any).data || []);

        this.totalReceitasCalc = this.listaReceitas.reduce((acc: number, r: any) => acc + Number(r.valorRecebido || 0), 0);
        this.totalDespesasCalc = this.listaDespesas.reduce((acc: number, d: any) => acc + Number(d.valor || 0), 0);
        this.saldoProjetado = this.totalReceitasCalc - this.totalDespesasCalc;

        const fechamento = historico.find((h: any) => h.mesAnoCompetencia === mesCompetencia);
        this.isConsolidado = !!fechamento;
        this.fechamentoAtual = fechamento || null;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar os dados do mês:', err);
        this.isLoading = false;
      }
    });
  }

  private carregarDadosDoAno(ano: string) {
    this.isLoading = true;

    forkJoin({
      receitas: this.apiService.getReceitas(), 
      despesas: this.apiService.getDespesas(),
      historico: this.apiService.getHistoricoFechamentos()
    }).subscribe({
      next: ({ receitas, despesas, historico }) => {
        const todasReceitas = Array.isArray(receitas) ? receitas : ((receitas as any).data || []);
        const todasDespesas = Array.isArray(despesas) ? despesas : ((despesas as any).data || []);

        const receitasAno = todasReceitas.filter((r: any) => (r.mesReferencia || '').endsWith(`/${ano}`));
        const despesasAno = todasDespesas.filter((d: any) => (d.mesReferencia || '').endsWith(`/${ano}`));
        const historicoAno = historico.filter((h: any) => (h.mesAnoCompetencia || '').endsWith(`/${ano}`));

        this.totalReceitasAno = receitasAno.reduce((acc: number, r: any) => acc + Number(r.valorRecebido || 0), 0);
        this.totalDespesasAno = despesasAno.reduce((acc: number, d: any) => acc + Number(d.valor || 0), 0);
        this.saldoAno = this.totalReceitasAno - this.totalDespesasAno;

        const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        this.mesesDoAno = [];

        for (let i = 1; i <= 12; i++) {
          const mesStr = String(i).padStart(2, '0');
          const ref = `${mesStr}/${ano}`;

          const recMes = receitasAno.filter((r: any) => r.mesReferencia === ref).reduce((acc: number, r: any) => acc + Number(r.valorRecebido || 0), 0);
          const despMes = despesasAno.filter((d: any) => d.mesReferencia === ref).reduce((acc: number, d: any) => acc + Number(d.valor || 0), 0);
          const fechamento = historicoAno.find((h: any) => h.mesAnoCompetencia === ref);

          this.mesesDoAno.push({
            ref: ref,
            nome: nomesMeses[i - 1],
            receitas: recMes,
            despesas: despMes,
            saldo: recMes - despMes,
            consolidado: !!fechamento
          });
        }

        this.mesesDoAno.reverse(); 
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar os dados do ano:', err);
        this.isLoading = false;
      }
    });
  }

  public baixarPDF() {
    alert('Em desenvolvimento...');
  }

  public voltar() {
    this.location.back();
  }
}