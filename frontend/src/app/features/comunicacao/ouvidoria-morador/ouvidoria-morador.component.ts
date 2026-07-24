import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-ouvidoria-morador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './ouvidoria-morador.component.html'
})
export class OuvidoriaMoradorComponent implements OnInit {
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  public chamadoForm!: FormGroup;
  public listaChamados: any[] = [];
  public isLoading = true;
  public isSubmitting = false;

  private usuarioId: number | null = null;

  async ngOnInit() {
    this.inicializarFormulario();
    await this.carregarUsuario();
    this.carregarOcorrencias();
  }

  private inicializarFormulario() {
    this.chamadoForm = this.fb.group({
      assunto: ['', [Validators.required, Validators.minLength(5)]],
      descricao: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private async carregarUsuario() {
    const user = await this.authService.getUserData();
    if (user) {
      this.usuarioId = user.id;
    }
  }

  private carregarOcorrencias() {
    this.isLoading = true;
    this.apiService.getOcorrencias().subscribe({
      next: (dados) => {
        // Ordena para mostrar o mais recente primeiro
        this.listaChamados = dados.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar chamados:', err);
        this.isLoading = false;
      }
    });
  }

  public enviarChamado() {
    if (this.chamadoForm.invalid) {
      this.chamadoForm.markAllAsTouched();
      return;
    }

    if (!this.usuarioId) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    this.isSubmitting = true;
    
    // NOVO PAYLOAD: Exatamente como o seu Swagger exige agora
    const payload = {
      usuarioId: this.usuarioId,
      assunto: this.chamadoForm.get('assunto')?.value,
      descricao: this.chamadoForm.get('descricao')?.value
    };

    this.apiService.criarOcorrencia(payload).subscribe({
      next: () => {
        alert('Chamado registrado com sucesso!');
        this.chamadoForm.reset();
        this.isSubmitting = false;
        this.carregarOcorrencias(); // Recarrega a lista
      },
      error: (err) => {
        console.error('Erro ao enviar chamado:', err);
        alert('Ocorreu um erro ao registrar a solicitação.');
        this.isSubmitting = false;
      }
    });
  }

  public deletarChamado(id: number) {
    const confirmacao = confirm('Tem certeza que deseja excluir esta solicitação?');
    if (!confirmacao) return;

    this.apiService.deletarOcorrencia(id).subscribe({
      next: () => {
        // Remove da lista local instantaneamente
        this.listaChamados = this.listaChamados.filter(c => c.id !== id);
        alert('Ocorrência excluída com sucesso.');
      },
      error: (err) => {
        console.error('Erro ao excluir:', err);
        // O backend pode retornar 403 se a regra "Restrito: Síndico" barrar a ação
        if (err.status === 403) {
          alert('Você não tem permissão para excluir esta ocorrência.');
        } else {
          alert('Erro ao excluir a ocorrência.');
        }
      }
    });
  }

  public voltar() {
    this.location.back();
  }
}