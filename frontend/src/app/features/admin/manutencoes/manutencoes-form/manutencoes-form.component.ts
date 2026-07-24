import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, ManutencaoPayload } from '../../../../core/services/api.service';

@Component({
  selector: 'app-manutencoes-form',
  standalone: true,
  imports: [CommonModule, IonContent, ReactiveFormsModule],
  templateUrl: './manutencoes-form.component.html'
})
export class ManutencoesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

  public form!: FormGroup;
  public isSubmitting = false;
  public manutencaoId: number | null = null;
  public isEditMode = false;

  ngOnInit() {
    this.iniciarFormulario();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.manutencaoId = parseInt(idParam, 10);
      this.isEditMode = true;
      this.carregarDadosEdicao();
    }
  }

  private iniciarFormulario() {
    this.form = this.fb.group({
      descricaoServico: ['', [Validators.required, Validators.minLength(5)]],
      periodicidadeMeses: ['', [Validators.required, Validators.min(1)]],
      dataUltimaExecucao: ['', [Validators.required]]
    });
  }

  private carregarDadosEdicao() {
    this.apiService.getManutencaoById(this.manutencaoId!).subscribe(dados => {
      const dataFormatada = dados.dataUltimaExecucao.split('T')[0];
      
      this.form.patchValue({
        descricaoServico: dados.descricaoServico,
        periodicidadeMeses: dados.periodicidadeMeses,
        dataUltimaExecucao: dataFormatada
      });
    });
  }

  public onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValues = this.form.value;

    const payload: ManutencaoPayload = {
      descricaoServico: formValues.descricaoServico,
      periodicidadeMeses: Number(formValues.periodicidadeMeses),
      dataUltimaExecucao: new Date(formValues.dataUltimaExecucao).toISOString()
    };

    if (this.isEditMode) {
      this.apiService.atualizarManutencao(this.manutencaoId!, payload).subscribe({
        next: () => this.finalizar('Manutenção atualizada com sucesso!'),
        error: () => this.isSubmitting = false
      });
    } else {
      this.apiService.criarManutencao(payload).subscribe({
        next: () => this.finalizar('Rotina de manutenção criada com sucesso!'),
        error: () => this.isSubmitting = false
      });
    }
  }

  private finalizar(mensagem: string) {
    alert(mensagem);
    this.apiService.registrarLog(this.isEditMode ? 'Edição de manutenção preventiva' : 'Criação de rotina preventiva').subscribe();
    this.voltar();
  }

  public temErro(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public voltar() {
    this.location.back();
  }
}