import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

export interface LogFormatado {
  id?: number;
  usuarioId: number;
  acao: string;         
  dataTratada: Date;     
  badgeBg: string;       
  badgeText: string;     
  dotClass: string;      
  categoriaLabel: string;
  nomeOperador: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, IonContent],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss'],
})
export class AuditoriaComponent {
  private location = inject(Location);
  private apiService = inject(ApiService);

  public logs: LogFormatado[] = [];
  public isLoading = true;

  ionViewWillEnter() {
    this.carregarLogs();
  }

  private carregarLogs() {
    this.isLoading = true;

    forkJoin({
      logsApi: this.apiService.getLogsAuditoria(),
      usuariosApi: this.apiService.getUsuarios()
    }).subscribe({
      next: (dados: any) => {
        this.logs = dados.logsApi.map((log: any): LogFormatado => {
          
          const usuario = dados.usuariosApi.find((u: any) => u.id === log.usuarioId);
          const nomeOperador = usuario ? (usuario.nomeCompleto || usuario.nome) : 'Sistema / Auto';

          const dataBruta = log.criadoEm || log.createdAt || log.dataCriacao || log.dataHora;
          const dataTratada = dataBruta ? new Date(dataBruta) : new Date();

          const estilo = this.obterEstiloPorAcao(log.acao || '');

          return {
            ...log,
            nomeOperador,
            dataTratada,
            badgeBg: estilo.bg,
            badgeText: estilo.text,
            dotClass: estilo.dot,
            categoriaLabel: estilo.label
          };
        });

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar registros de auditoria:', err);
        this.isLoading = false;
      }
    });
  }

  private obterEstiloPorAcao(acao: string) {
    const texto = acao.toLowerCase();

    if (texto.includes('excluiu') || texto.includes('remover') || texto.includes('revog') || texto.includes('delet')) {
      return { dot: 'border-red-400 bg-red-100', bg: 'bg-red-100', text: 'text-red-700', label: 'EXCLUSÃO' };
    }
    
    if (texto.includes('criou') || texto.includes('cadastro') || texto.includes('aprov') || texto.includes('adicionou')) {
      return { dot: 'border-emerald-400 bg-emerald-100', bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'CRIAÇÃO' };
    }
    
    if (texto.includes('ediç') || texto.includes('atualiz') || texto.includes('alter')) {
      return { dot: 'border-amber-400 bg-amber-100', bg: 'bg-amber-100', text: 'text-amber-700', label: 'EDIÇÃO' };
    }
    
    if (texto.includes('consolid') || texto.includes('fechamento') || texto.includes('rateio')) {
      return { dot: 'border-indigo-400 bg-indigo-100', bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'FINANCEIRO' };
    }
    
    if (texto.includes('login') || texto.includes('acesso') || texto.includes('visualizou')) {
      return { dot: 'border-blue-400 bg-blue-100', bg: 'bg-blue-100', text: 'text-blue-700', label: 'ACESSO' };
    }

    return { dot: 'border-gray-400 bg-gray-100', bg: 'bg-gray-100', text: 'text-gray-700', label: 'SISTEMA' };
  }

  public voltar() {
    this.location.back();
  }
}