import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-editar-unidades',standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './editar-unidades.component.html',
  styleUrls: ['./editar-unidades.component.scss'],
})
export class EditarUnidadesComponent  implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  public unidadeForm!: FormGroup;
  public unidadeId!: number;
  public numeroUnidade: string = '...';
  public isLoading = true;
  public isSaving = false;

  ngOnInit() {
    this.inicializarFormulario();

    // Captura o ID vindo da rota (ex: /editar-unidade/1)
    this.unidadeId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.unidadeId) {
      this.carregarDadosUnidade();
    } else {
      alert('ID da unidade não localizado.');
      this.voltar();
    }
  }

  private inicializarFormulario(): void {
    this.unidadeForm = this.fb.group({
      statusOcupacao: ['', Validators.required],
      vagaGaragem: ['', [Validators.maxLength(100)]]
    });
  }

  private carregarDadosUnidade(): void {
    this.isLoading = true;
    this.apiService.getUnidadeById(this.unidadeId).subscribe({
      next: (unidade) => {
        this.numeroUnidade = unidade.numero;
        this.unidadeForm.patchValue({
          statusOcupacao: unidade.statusOcupacao,
          vagaGaragem: unidade.vagaGaragem || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar dados da unidade:', err);
        alert('Não foi possível carregar os dados da unidade.');
        this.voltar();
      }
    });
  }

  public onSubmit(): void {
    if (this.unidadeForm.invalid) {
      this.unidadeForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.unidadeForm.value;

    this.apiService.atualizarUnidade(this.unidadeId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        alert('Unidade atualizada com sucesso!');
        this.voltar();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erro ao atualizar unidade:', err);
        alert('Erro ao salvar as alterações da unidade.');
      }
    });
  }

  public voltar(): void {
    this.location.back();
  }
}
