import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs'; // Importante adicionar esta importação

@Component({
  selector: 'app-ouvidoria-sindico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './ouvidoria-sindico.component.html'
})
export class OuvidoriaSindicoComponent {
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  public formResposta!: FormGroup;
  public chamadoExpandidoId: number | null = null;
  public isSaving = false;
  public isLoading = true;
  public listaChamados: any[] = [];

  ionViewWillEnter() {
    this.inicializarFormulario();
    this.carregarDados();
  }

  private inicializarFormulario() {
    this.formResposta = this.fb.group({
      novoStatus: ['', Validators.required],
      resposta: [''] 
    });
  }

  private carregarDados() {
    this.isLoading = true;
    // Buscamos chamados e usuários em paralelo para cruzar os dados
    forkJoin({
      chamados: this.apiService.getOcorrencias(),
      usuarios: this.apiService.getUsuarios()
    }).subscribe({
      next: (dados: any) => {
        this.listaChamados = dados.chamados.map((chamado: any) => {
          const usuario = dados.usuarios.find((u: any) => u.id === chamado.usuarioId);
          return {
            ...chamado,
            nomeUsuario: usuario ? (usuario.nomeCompleto || usuario.nome) : 'Usuário Desconhecido'
          };
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar dados:', err);
        this.isLoading = false;
      }
    });
  }

  public alternarChamado(chamado: any) {
    if (chamado.status === 'RESOLVIDO') return;
    if (this.chamadoExpandidoId === chamado.id) {
      this.chamadoExpandidoId = null;
    } else {
      this.chamadoExpandidoId = chamado.id;
      this.formResposta.patchValue({ novoStatus: chamado.status });
    }
  }

  public enviarResposta(chamadoId: number) {
    if (this.formResposta.invalid) return;

    this.isSaving = true;
    const novoStatus = this.formResposta.get('novoStatus')?.value;

    this.apiService.atualizarStatusOcorrencia(chamadoId, novoStatus).subscribe({
      next: () => {
        const index = this.listaChamados.findIndex(c => c.id === chamadoId);
        if (index !== -1) this.listaChamados[index].status = novoStatus;
        this.isSaving = false;
        this.chamadoExpandidoId = null;
      },
      error: () => {
        alert('Falha ao atualizar.');
        this.isSaving = false;
      }
    });
  }

  public voltar() { this.location.back(); }
}