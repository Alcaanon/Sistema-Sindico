import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { IonContent } from "@ionic/angular/standalone";
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consolidacao',
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule],
  templateUrl: './consolidacao.component.html'
})
export class ConsolidacaoComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private apiService = inject(ApiService);

  public mesReferenciaVisual = '';
  public mesReferenciaAPI = ''; 
  public listaMesesDisponiveis: string[] = [];
  
  public saldoAnterior = 0; 
  public totalReceitas = 0;
  public totalDespesas = 0;
  public saldoAtualizado = 0;
  
  public despesasMesAnterior = 0; 
  public reduziuCustos = false;
  public percentualComparativo = 0;

  public isLoading = false;
  public isConsolidado = false;

  ngOnInit() {
    this.carregarResumoInicial();
  }

  private carregarResumoInicial() {
    this.isLoading = true;

    this.apiService.getResumoMesAtual().subscribe({
      next: (resumo) => {
        if (!resumo) {
          this.isLoading = false;
          return;
        }

        const mesAtualBanco = resumo.mesReferenciaOriginal || '';
        this.mesReferenciaAPI = mesAtualBanco;
        this.mesReferenciaVisual = resumo.mesReferencia || mesAtualBanco;

        if (mesAtualBanco) {
          this.gerarOpcoesMeses(mesAtualBanco);
        }

        this.carregarDadosDoMes(this.mesReferenciaAPI);
      },
      error: () => {
        this.isLoading = false;
        alert('Não foi possível carregar os dados de consolidação.');
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

  public onMudarFiltroMes(novoMes: string): void {
    this.mesReferenciaAPI = novoMes;
    
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const [mesStr, ano] = novoMes.split('/'); 
    const indexMes = parseInt(mesStr, 10) - 1;
    this.mesReferenciaVisual = `${nomesMeses[indexMes]} / ${ano}`;

    this.carregarDadosDoMes(novoMes);
  }

  private carregarDadosDoMes(mesCompetencia: string) {
    this.isLoading = true;
    this.isConsolidado = false;

    forkJoin({
      receitas: this.apiService.getReceitas(mesCompetencia),
      despesas: this.apiService.getDespesas(mesCompetencia),
      historico: this.apiService.getHistoricoFechamentos()
    }).subscribe({
      next: ({ receitas, despesas, historico }) => {
        this.totalReceitas = receitas.reduce((acc, r) => acc + Number(r.valorRecebido || 0), 0);
        this.totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);

        if (historico && historico.length > 0) {
          const fechamentoAtual = historico.find((h: any) => 
            h.mesAnoCompetencia === mesCompetencia || h.mesReferencia === mesCompetencia
          );
          
          if (fechamentoAtual) {
            this.isConsolidado = true;
          }

          const [mesAtualStr, anoAtualStr] = mesCompetencia.split('/');
          let mesAnt = parseInt(mesAtualStr, 10) - 1;
          let anoAnt = parseInt(anoAtualStr, 10);
          if (mesAnt < 1) {
            mesAnt = 12;
            anoAnt--;
          }
          const mesAnteriorRef = `${String(mesAnt).padStart(2, '0')}/${anoAnt}`;

          const fechamentoMesAnterior = historico.find((h: any) => 
            h.mesAnoCompetencia === mesAnteriorRef || h.mesReferencia === mesAnteriorRef
          );

          if (fechamentoMesAnterior) {
            this.saldoAnterior = Number(fechamentoMesAnterior.saldoAtualizadoCaixa) || 0;
            this.despesasMesAnterior = Number(fechamentoMesAnterior.totalDespesas) || 0;
          } else {
            this.saldoAnterior = 0;
            this.despesasMesAnterior = 0;
          }
        } else {
          this.saldoAnterior = 0;
          this.despesasMesAnterior = 0;
        }

        this.saldoAtualizado = this.saldoAnterior + this.totalReceitas - this.totalDespesas;
        this.calcularComparativo();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes do extrato', err);
        this.isLoading = false;
      }
    });
  }

  private calcularComparativo() {
    if (this.despesasMesAnterior === 0) {
      this.percentualComparativo = 0;
      this.reduziuCustos = false;
      return;
    }
    const diferenca = this.totalDespesas - this.despesasMesAnterior;
    this.percentualComparativo = Math.abs((diferenca / this.despesasMesAnterior) * 100);
    this.reduziuCustos = this.totalDespesas < this.despesasMesAnterior;
  }

  public congelarMes() {
    if (this.isConsolidado) {
      alert('Este mês já se encontra consolidado e congelado.');
      return;
    }

    if (this.isMesFuturo(this.mesReferenciaAPI)) {
      alert('Operação Bloqueada: Não é possível consolidar um mês do futuro. Aguarde o fechamento real do período.');
      return;
    }

    if (this.totalDespesas <= 0) {
      alert('Não é possível consolidar meses sem despesas registradas ou com valor zerado.');
      return;
    }

    const hoje = new Date();
    const [mesStr, anoStr] = this.mesReferenciaAPI.split('/');
    const compValor = (parseInt(anoStr, 10) * 12) + parseInt(mesStr, 10);
    const atualValor = (hoje.getFullYear() * 12) + (hoje.getMonth() + 1);

    if (compValor === atualValor && hoje.getDate() < 25) {
      alert(`O fechamento do mês atual só é permitido a partir do dia 25. Faltam ${25 - hoje.getDate()} dia(s) para o prazo.`);
      return;
    }

    if (this.isMesRetroativoInvalido(this.mesReferenciaAPI)) {
      alert('Operação Bloqueada: Não é permitido consolidar meses retroativos com mais de 1 mês de defasagem (apenas o mês atual ou o mês imediatamente anterior são aceitos).');
      return;
    }

    const confirmacao = confirm(`Atenção: Ao consolidar ${this.mesReferenciaVisual}, nenhum lançamento retroativo poderá ser feito. Deseja prosseguir?`);
    
    if (confirmacao) {
      this.isLoading = true;
      
      const payload = {
        mesAnoCompetencia: this.mesReferenciaAPI
      };

      this.apiService.consolidarMes(payload).subscribe({
        next: () => {
          const acaoAuditoria = `Consolidou e congelou definitivamente o caixa de ${this.mesReferenciaAPI} (Receitas: R$ ${this.totalReceitas} | Despesas: R$ ${this.totalDespesas} | Saldo Final: R$ ${this.saldoAtualizado})`;

          this.apiService.registrarLog(acaoAuditoria).subscribe({
            next: () => this.finalizarERedirecionar(`Caixa consolidado! O mês de ${this.mesReferenciaVisual} foi fechado.`),
            error: (err) => {
              console.error('Erro silencioso ao gravar log de auditoria', err);
              this.finalizarERedirecionar(`Caixa consolidado! O mês de ${this.mesReferenciaVisual} foi fechado.`);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          let msgErro = 'Falha ao consolidar o mês.';
          if (err.error?.message) {
            msgErro = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          }
          alert(msgErro);
        }
      });
    }
  }

  private finalizarERedirecionar(mensagem: string): void {
    this.isLoading = false;
    alert(mensagem);
    this.router.navigate(['/sindico'], { replaceUrl: true }).then(() => {
      window.location.reload();
    });
  }

  public isMesFuturo(mesAnoStr: string): boolean {
    if (!mesAnoStr || !mesAnoStr.includes('/')) return false;

    const [mesStr, anoStr] = mesAnoStr.split('/');
    const compAno = parseInt(anoStr, 10);
    const compMes = parseInt(mesStr, 10);

    const hoje = new Date();
    const atualValor = (hoje.getFullYear() * 12) + (hoje.getMonth() + 1);
    const compValor = (compAno * 12) + compMes;

    return compValor > atualValor;
  }

  public isMesRetroativoInvalido(mesAnoStr: string): boolean {
    if (!mesAnoStr || !mesAnoStr.includes('/')) return false;

    const [mesStr, anoStr] = mesAnoStr.split('/');
    const compAno = parseInt(anoStr, 10);
    const compMes = parseInt(mesStr, 10);

    const hoje = new Date();
    const atualValor = (hoje.getFullYear() * 12) + (hoje.getMonth() + 1);
    const compValor = (compAno * 12) + compMes;
    const diaAtual = hoje.getDate();

    if (compValor === atualValor && diaAtual < 25) {
      return true;
    }

    const limitePermitidoValor = atualValor - 1;

    if (compValor < limitePermitidoValor) {
      return true;
    }

    return false;
  }

  public voltar() {
    this.location.back();
  }
}