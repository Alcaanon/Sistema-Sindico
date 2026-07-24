import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export function dataMinimaValidator(minDateFn: () => string) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const minDateStr = minDateFn();
    if (!minDateStr) return null;
    const dataSelecionada = new Date(control.value + 'T00:00:00').getTime();
    const dataMinima = new Date(minDateStr + 'T00:00:00').getTime();
    if (dataSelecionada < dataMinima) return { dataRetroativa: true };
    return null;
  };
}

export function mesMinimoValidator(minDateFn: () => string) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const minDateStr = minDateFn(); 
    if (!minDateStr) return null;

    const [minAnoStr, minMesStr] = minDateStr.split('-');
    const minAno = parseInt(minAnoStr, 10);
    const minMes = parseInt(minMesStr, 10);

    const [valMesStr, valAnoStr] = control.value.split('/'); 
    if (!valAnoStr || !valMesStr) return null;

    const valAno = parseInt(valAnoStr, 10);
    const valMes = parseInt(valMesStr, 10);

    if (valAno < minAno || (valAno === minAno && valMes < minMes)) {
      return { mesRetroativo: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-lancamento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './lancamento.component.html'
})
export class LancamentoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router); 
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService); 

  public tipoLancamento: 'RECEITA' | 'DESPESA' = 'DESPESA';
  public isEdicao = false;
  public lancamentoId!: number;
  public usuarioId!: number;
  
  public lancamentoForm!: FormGroup;
  public isLoading = false;
  public minDate: string = '';

  async ngOnInit() {
    this.inicializarFormulario();

    const userData = await this.authService.getUserData();
    if (userData && userData.id) {
      this.usuarioId = userData.id;
    }

    this.route.queryParams.subscribe(params => {
      if (params['tipo']) {
        this.tipoLancamento = params['tipo'];
        this.atualizarValidadoresDinamicos(); 
      }

      if (params['minDate']) {
        this.minDate = params['minDate'];
      } else {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        this.minDate = `${ano}-${mes}-01`;
      }

      this.lancamentoForm.get('dataRecebimento')?.updateValueAndValidity();
      this.lancamentoForm.get('mesReferencia')?.updateValueAndValidity();
      
      if (params['id']) {
        this.isEdicao = true;
        this.lancamentoId = Number(params['id']);
        this.lancamentoForm.get('numeroParcelas')?.disable();
        this.carregarDadosParaEdicao();
      }
    });
  }

  private inicializarFormulario(): void {
    const dataAtual = new Date();
    const mesAtualFormatado = `${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;
    const dataHojeIso = dataAtual.toISOString().split('T')[0];

    this.lancamentoForm = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(255)]],
      valor: ['', [Validators.required, Validators.min(0.01)]],
      mesReferencia: [mesAtualFormatado, [
        Validators.required, 
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{4}$/),
        mesMinimoValidator(() => this.minDate) 
      ]],
      categoria: ['', Validators.required], 
      numeroParcelas: [1, [Validators.required, Validators.min(1)]],
      
      unidadeId: [null], 
      dataRecebimento: [dataHojeIso, [dataMinimaValidator(() => this.minDate)]], 
      
      pagoPeloSindico: [false]
    });
  }

  private atualizarValidadoresDinamicos(): void {
    const ctrlUnidade = this.lancamentoForm.get('unidadeId');
    const ctrlDataRec = this.lancamentoForm.get('dataRecebimento');

    if (this.tipoLancamento === 'RECEITA') {
      ctrlUnidade?.setValidators([Validators.required]);
      ctrlDataRec?.setValidators([Validators.required, dataMinimaValidator(() => this.minDate)]);
    } else {
      ctrlUnidade?.clearValidators();
      ctrlDataRec?.clearValidators();
    }

    ctrlUnidade?.updateValueAndValidity();
    ctrlDataRec?.updateValueAndValidity();
  }

  private carregarDadosParaEdicao(): void {
    if (this.tipoLancamento === 'RECEITA') {
      this.apiService.getReceitaById(this.lancamentoId).subscribe(dados => {
        const dataFormatada = new Date(dados.dataRecebimento).toISOString().split('T')[0];
        this.lancamentoForm.patchValue({
          descricao: dados.descricao,
          valor: dados.valorRecebido,
          mesReferencia: dados.mesReferencia,
          categoria: dados.tipoReceita,
          numeroParcelas: dados.numeroParcelas,
          unidadeId: dados.unidadeId,
          dataRecebimento: dataFormatada
        });
      });
    } else {
      this.apiService.getDespesaById(this.lancamentoId).subscribe(dados => {
        this.lancamentoForm.patchValue({
          descricao: dados.descricao,
          valor: dados.valor,
          mesReferencia: dados.mesReferencia,
          categoria: dados.tipoDespesa,
          numeroParcelas: dados.numeroParcelas,
          pagoPeloSindico: dados.pagoPeloSindico
        });
      });
    }
  }

  public onSubmit(): void {
    if (this.lancamentoForm.invalid) {
      this.lancamentoForm.markAllAsTouched();
      
      if (this.lancamentoForm.get('mesReferencia')?.hasError('mesRetroativo')) {
         alert('Competência Inválida: Não é permitido registrar lançamentos em meses já fechados.');
      }
      return;
    }

    if (this.tipoLancamento === 'DESPESA' && !this.usuarioId) {
      alert('Sessão desatualizada: Não foi possível identificar o seu usuário.');
      return;
    }

    this.isLoading = true;
    
    const form = this.lancamentoForm.getRawValue();

    let mesFormatadoParaBackend = form.mesReferencia;
    if (mesFormatadoParaBackend && mesFormatadoParaBackend.includes('-')) {
      const [ano, mes] = mesFormatadoParaBackend.split('-');
      mesFormatadoParaBackend = `${mes}/${ano}`;
    }
    
    const payloadBase = {
      descricao: form.descricao,
      mesReferencia: mesFormatadoParaBackend,
      numeroParcelas: Number(form.numeroParcelas)
    };

    const payload = this.tipoLancamento === 'DESPESA' 
      ? {
          ...payloadBase,
          valor: Number(form.valor),
          tipoDespesa: form.categoria,
          pagoPeloSindico: form.pagoPeloSindico,
          cadastradoPorId: Number(this.usuarioId),
        } 
      : {
          ...payloadBase,
          valorRecebido: Number(form.valor),
          tipoReceita: form.categoria,
          dataRecebimento: new Date(form.dataRecebimento).toISOString(),
          unidadeId: Number(form.unidadeId),
        };

    if (this.isEdicao) delete (payload as any).numeroParcelas;

    let request$: Observable<any>;

    if (this.isEdicao) {
      request$ = this.tipoLancamento === 'DESPESA' 
        ? this.apiService.atualizarDespesa(this.lancamentoId, payload) 
        : this.apiService.atualizarReceita(this.lancamentoId, payload);
    } else {
      request$ = this.tipoLancamento === 'DESPESA' 
        ? this.apiService.criarDespesa(payload) 
        : this.apiService.criarReceita(payload);
    }

    request$.subscribe({
      next: () => {
        const tipoLog = this.tipoLancamento.toLowerCase();
        
        const acaoAuditoria = this.isEdicao
          ? `Editou a ${tipoLog} ID ${this.lancamentoId}: "${form.descricao}" no valor de R$ ${form.valor}`
          : `Criou uma nova ${tipoLog}: "${form.descricao}" no valor de R$ ${form.valor} (Ref: ${mesFormatadoParaBackend})`;

        this.apiService.registrarLog(acaoAuditoria).subscribe({
          next: () => this.finalizarERedirecionar(),
          error: (err) => {
            console.error('Erro silencioso ao gravar log de auditoria', err);
            this.finalizarERedirecionar(); 
          }
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        alert(`Falha (400):\n- ${err.error?.message || 'Dados inválidos'}`);
      }
    });
  }

  private finalizarERedirecionar(): void {
    this.isLoading = false;
    this.router.navigate(['/sindico'], { replaceUrl: true }).then(() => { 
      window.location.reload(); 
    });
  }

  public voltar(): void {
    this.router.navigate(['/sindico'], { replaceUrl: true });
  }
}