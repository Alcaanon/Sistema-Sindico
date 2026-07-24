import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService, ManutencaoPayload } from '../../../core/services/api.service';

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [CommonModule, IonContent],
  templateUrl: './manutencoes.component.html'
})
export class ManutencoesComponent implements OnInit {
  private location = inject(Location);
  private router = inject(Router);
  private apiService = inject(ApiService);

  public manutencoes: ManutencaoPayload[] = [];
  public isLoading = true;

  ngOnInit() {
    this.carregarManutencoes();
  }

  public carregarManutencoes() {
    this.isLoading = true;
    this.apiService.getManutencoes().subscribe({
      next: (dados) => {
        this.manutencoes = dados;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar manutenções:', err);
        this.isLoading = false;
      }
    });
  }

  public calcularProximaData(dataUltima: string, periodicidade: number): Date {
    const data = new Date(dataUltima);
    data.setMonth(data.getMonth() + periodicidade);
    return data;
  }

  public isAtrasada(dataUltima: string, periodicidade: number): boolean {
    const proxima = this.calcularProximaData(dataUltima, periodicidade);
    return proxima < new Date();
  }

  public novaManutencao() {
    this.router.navigate(['/manutencoes/form']);
  }

  public editarManutencao(id: number) {
    this.router.navigate(['/manutencoes/form', id]);
  }

  public deletar(id: number, descricao: string) {
    if (confirm(`Deseja realmente excluir a rotina "${descricao}"?`)) {
      this.apiService.deletarManutencao(id).subscribe({
        next: () => {
          this.apiService.registrarLog(`Exclusão de manutenção preventiva: ${descricao}`).subscribe();
          this.carregarManutencoes();
        },
        error: (err) => alert('Erro ao excluir manutenção.')
      });
    }
  }

  public voltar() {
    this.location.back();
  }
}