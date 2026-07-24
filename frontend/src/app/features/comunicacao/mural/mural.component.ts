import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service'; 

@Component({
  selector: 'app-mural',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './mural.component.html'
})
export class MuralComponent implements OnInit {
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  public isSindico = false;
  public regras: any[] = [];
  public isLoading = true;

  public regraForm!: FormGroup;
  public showForm = false;
  public isEditing = false;
  public editingId: number | null = null;
  public isSaving = false;

  async ngOnInit() {
    this.inicializarForm();
    await this.verificarPerfil();
    this.carregarRegras();
  }

  private async verificarPerfil() {
    const user = await this.authService.getUserData();
    if (user && user.perfil === 'SINDICO') {
      this.isSindico = true;
    }
  }

  private inicializarForm() {
    this.regraForm = this.fb.group({
      tituloRegra: ['', Validators.required],
      descricaoDetalhada: ['', Validators.required]
    });
  }

  private carregarRegras() {
    this.isLoading = true;
    this.apiService.getRegras().subscribe({
      next: (dados) => {
        this.regras = dados;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar regras:', err);
        this.isLoading = false;
      }
    });
  }

  public getEstiloRegra(titulo: string) {
    const t = titulo.toLowerCase();
    if (t.includes('lixo') || t.includes('coleta') || t.includes('resíduo')) 
      return { tipo: 'LIXO', border: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
    
    if (t.includes('silêncio') || t.includes('barulho') || t.includes('horário') || t.includes('obra')) 
      return { tipo: 'SILENCIO', border: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' };
    
    if (t.includes('garagem') || t.includes('veículo') || t.includes('carro') || t.includes('vaga')) 
      return { tipo: 'GARAGEM', border: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' };
    
    return { tipo: 'OUTROS', border: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' };
  }

  public abrirNovoForm() {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.regraForm.reset();
  }

  public abrirEditarForm(regra: any) {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = regra.id;
    this.regraForm.patchValue({
      tituloRegra: regra.tituloRegra,
      descricaoDetalhada: regra.descricaoDetalhada
    });
  }

  public cancelarForm() {
    this.showForm = false;
    this.regraForm.reset();
  }

  public salvarRegra() {
    if (this.regraForm.invalid) return;

    this.isSaving = true;
    const payload = this.regraForm.value;

    if (this.isEditing && this.editingId) {
      this.apiService.atualizarRegra(this.editingId, payload).subscribe({
        next: () => {
          const acaoAuditoria = `Editou o aviso no mural (ID ${this.editingId}): "${payload.tituloRegra}"`;
          
          this.apiService.registrarLog(acaoAuditoria).subscribe({
            next: () => this.finalizarAcao('Regra atualizada com sucesso!'),
            error: () => this.finalizarAcao('Regra atualizada com sucesso!')
          });
        },
        error: () => { this.isSaving = false; alert('Erro ao atualizar regra.'); }
      });
    } else {
      this.apiService.criarRegra(payload).subscribe({
        next: () => {
          const acaoAuditoria = `Publicou um novo aviso no mural: "${payload.tituloRegra}"`;
          
          this.apiService.registrarLog(acaoAuditoria).subscribe({
            next: () => this.finalizarAcao('Regra criada com sucesso!'),
            error: () => this.finalizarAcao('Regra criada com sucesso!')
          });
        },
        error: () => { this.isSaving = false; alert('Erro ao criar regra.'); }
      });
    }
  }

  public deletarRegra(id: number) {
    if (confirm('Tem certeza que deseja excluir esta regra permanentemente?')) {
      
      const regraExcluida = this.regras.find(r => r.id === id);
      const tituloParaLog = regraExcluida ? regraExcluida.tituloRegra : 'Aviso Desconhecido';

      this.apiService.deletarRegra(id).subscribe({
        next: () => {
          const acaoAuditoria = `Excluiu o aviso do mural (ID ${id}): "${tituloParaLog}"`;
          
          this.apiService.registrarLog(acaoAuditoria).subscribe({
            next: () => this.carregarRegras(),
            error: () => this.carregarRegras()
          });
        },
        error: () => alert('Erro ao excluir a regra.')
      });
    }
  }

  private finalizarAcao(mensagem: string) {
    this.isSaving = false;
    this.showForm = false;
    this.regraForm.reset();
    alert(mensagem);
    this.carregarRegras();
  }

  public voltar() {
    this.location.back();
  }
}