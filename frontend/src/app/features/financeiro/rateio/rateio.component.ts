import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-rateio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent],
  templateUrl: './rateio.component.html',
  styleUrls: ['./rateio.component.scss'],
})
export class RateioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private location = inject(Location);
  private apiService = inject(ApiService);

  public rateioForm!: FormGroup;
  public totalDespesas = 0;
  public totalReceitas = 0;
  public valorCota = 0;
  public mesReferenciaVisual = '';
  public mesAnoCompetencia = '';
  
  public listaMesesDisponiveis: string[] = [];
  public isLoading = false;
  public listaDespesas: any[] = [];
  public listaReceitas: any[] = [];

  ngOnInit(): void {
    this.inicializarFormulario();
    this.carregarDadosIniciais();
  }

  private inicializarFormulario(): void {
    const dataPadrao = new Date();
    dataPadrao.setMonth(dataPadrao.getMonth() + 1);
    dataPadrao.setDate(10); 

    this.rateioForm = this.fb.group({
      fundoReserva: [100.00, [Validators.required, Validators.min(0)]],
      dataVencimento: [dataPadrao.toISOString().split('T')[0], Validators.required]
    });

    this.rateioForm.get('fundoReserva')?.valueChanges.subscribe(() => {
      this.calcularCota();
    });
  }

  private carregarDadosIniciais(): void {
    this.apiService.getResumoMesAtual().subscribe({
      next: (resumo) => {
        if (!resumo) return;

        const mesAtualBanco = resumo.mesReferenciaOriginal || '';
        this.mesAnoCompetencia = mesAtualBanco;
        this.mesReferenciaVisual = resumo.mesReferencia || mesAtualBanco;

        if (mesAtualBanco) {
          this.gerarOpcoesMeses(mesAtualBanco);
        }

        this.carregarDadosDoMes(this.mesAnoCompetencia);
      },
      error: (err) => {
        console.error('Erro ao buscar resumo para rateio:', err);
        alert('Não foi possível carregar os dados do mês.');
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
    this.mesAnoCompetencia = novoMes;
    this.mesReferenciaVisual = novoMes; 
    this.carregarDadosDoMes(novoMes);
  }

  private carregarDadosDoMes(mesCompetencia: string): void {
    this.isLoading = true;

    forkJoin({
      despesasRes: this.apiService.getDespesas(mesCompetencia),
      receitasRes: this.apiService.getReceitas(mesCompetencia)
    }).subscribe({
      next: ({ despesasRes, receitasRes }) => {
        const arrDespesas = Array.isArray(despesasRes) ? despesasRes : ((despesasRes as any)?.data || (despesasRes as any)?.items || []);
        const arrReceitas = Array.isArray(receitasRes) ? receitasRes : ((receitasRes as any)?.data || (receitasRes as any)?.items || []);

        this.listaDespesas = arrDespesas;
        this.listaReceitas = arrReceitas;

        this.totalDespesas = this.listaDespesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
        this.totalReceitas = this.listaReceitas.reduce((acc, r) => acc + Number(r.valorRecebido || 0), 0);

        this.calcularCota();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar despesas/receitas do mês selecionado', err);
        this.isLoading = false;
      }
    });
  }

  private calcularCota(): void {
    const fundo = Number(this.rateioForm.get('fundoReserva')?.value || 0);
    this.valorCota = Number(((this.totalDespesas + fundo) / 4).toFixed(2));
  }

  public isMesRetroativoInvalido(mesAnoStr: string): boolean {
    if (!mesAnoStr || !mesAnoStr.includes('/')) return false;

    const [mesStr, anoStr] = mesAnoStr.split('/');
    const compAno = parseInt(anoStr, 10);
    const compMes = parseInt(mesStr, 10);

    const hoje = new Date();
    const atualAno = hoje.getFullYear();
    const atualMes = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    const compValor = (compAno * 12) + compMes;
    const atualValor = (atualAno * 12) + atualMes;

    if (compValor === atualValor && diaAtual < 25) {
      return true;
    }

    const limitePermitidoValor = atualValor - 1;

    if (compValor < limitePermitidoValor || compValor > atualValor) {
      return true;
    }

    return false;
  }

  public aprovarRateio(): void {
    if (this.rateioForm.invalid) return;

    if (this.totalDespesas <= 0) {
      alert('Operação Bloqueada: Não é possível gerar rateio para meses sem despesas cadastradas (o Fundo de Reserva isolado não gera cobrança de cotas).');
      return;
    }

    if (this.isMesRetroativoInvalido(this.mesAnoCompetencia)) {
      alert('Operação Bloqueada: Não é permitido gerar rateios para períodos retroativos superiores a 1 mês de defasagem ou para o mês atual antes do dia 25.');
      return;
    }

    this.isLoading = true;

    const fundoReserva = Number(this.rateioForm.get('fundoReserva')?.value);
    const dataVencimento = this.rateioForm.get('dataVencimento')?.value;

    const payload = {
      mesAnoCompetencia: this.mesAnoCompetencia,
      saldoAnteriorCaixa: 0, 
      fundoReservaAdicionado: fundoReserva,
      dataVencimento: new Date(dataVencimento).toISOString()
    };

    this.apiService.processarFechamento(payload).subscribe({
      next: () => {
        const acaoAuditoria = `Gerou e aprovou o rateio de ${this.mesAnoCompetencia}: Despesas (R$ ${this.totalDespesas}) + Reserva (R$ ${fundoReserva}) gerando cotas de R$ ${this.valorCota}`;

        this.apiService.registrarLog(acaoAuditoria).subscribe({
          next: () => this.finalizarERedirecionar(`Rateio de ${this.mesAnoCompetencia} aprovado! As cotas foram geradas com status PENDENTE para todas as unidades.`),
          error: (err) => {
            console.error('Erro silencioso ao gravar log de auditoria', err);
            this.finalizarERedirecionar(`Rateio de ${this.mesAnoCompetencia} aprovado! As cotas foram geradas com status PENDENTE para todas as unidades.`);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erro ao aprovar rateio:', err);

        let msgErro = 'Falha ao processar rateio.';
        if (err.status === 409) {
          msgErro = 'Este mês já foi fechado e consolidado!';
        } else if (err.error?.message) {
          msgErro = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
        }

        alert(msgErro);
      }
    });
  }

  private finalizarERedirecionar(mensagem: string): void {
    this.isLoading = false;
    alert(mensagem);
    this.router.navigate(['/sindico'], { replaceUrl: true }).then(() => {
      window.location.reload();
    });
  }

  public voltar(): void {
    this.location.back();
  }
}