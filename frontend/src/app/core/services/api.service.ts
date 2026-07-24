import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================================
// INTERFACES
// ==========================================================

export interface ResumoFinanceiro {
  saldoCaixa: number;
  totalReceitas: number;
  totalDespesas: number;
  mesReferencia: string;
}

export interface Despesa {
  id?: number;
  cadastradoPorId?: number;
  mesReferencia: string;
  descricao: string;
  valor: number;
  tipoDespesa: string;
  pagoPeloSindico: boolean;
  urlComprovante?: string;
  numeroParcelas: number;
  parcelaAtual: number;
  despesaPaiId?: number;
}

export interface Receita {
  id?: number;
  unidadeId: number;
  mesReferencia: string;
  descricao: string;
  valorRecebido: number;
  dataRecebimento: string | Date;
  tipoReceita: string;
  numeroParcelas: number;
  parcelaAtual: number;
  receitaPaiId?: number;
}

export interface Cobranca {
  id: number;
  unidadeId: number;
  statusPagamento: 'PENDENTE' | 'PAGO';
  urlComprovantePix?: string;
  dataPagamento?: string | Date;
  unidade?: { numero: string };
  fechamento?: { mesAnoCompetencia: string; valorCotaPorUnidade: number; dataVencimento: string };
}

export interface UsuarioPayload {
  id?: number;
  unidadeNumero: string;
  nomeCompleto: string;
  cpf: string;
  whatsapp: string;
  email: string;
  perfil: 'MORADOR' | 'SINDICO' | string;
  senha?: string;
  aceiteLgpd: boolean;
  dataAceite: string;
}

export interface ManutencaoPayload {
  id?: number;
  descricaoServico: string;
  periodicidadeMeses: number;
  dataUltimaExecucao: string;
}

export interface ResumoFinanceiro {
  saldoCaixa: number;
  totalReceitas: number;
  totalDespesas: number;
  mesReferencia: string;
  mesReferenciaOriginal?: string; // <-- NOVA PROPRIEDADE
}

// ==========================================================
// SERVICE
// ==========================================================

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; 

  // --- DASHBOARD ---
  public getResumoMesAtual(): Observable<ResumoFinanceiro> {
    return this.http.get<ResumoFinanceiro>(`${this.apiUrl}/fechamentos/resumo-mes`).pipe(
      map(dados => {
        const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const [mesStr, ano] = dados.mesReferencia.split('/'); 
        const indexMes = parseInt(mesStr, 10) - 1;
        
        return { 
          ...dados, 
          mesReferenciaOriginal: dados.mesReferencia, // <-- SALVA O "07/2026" PARA O BACKEND
          mesReferencia: `${nomesMeses[indexMes]} / ${ano}` 
        };
      })
    );
  }

  public consolidarMes(payload: { mesAnoCompetencia: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/fechamentos/consolidar`, payload);
  }

  // --- USUÁRIOS (SÍNDICOS / MORADORES) ---
  public getUsuarios(): Observable<UsuarioPayload[]> {
    return this.http.get<UsuarioPayload[]>(`${this.apiUrl}/usuarios`);
  }

  public getUsuarioById(id: number): Observable<UsuarioPayload> {
    return this.http.get<UsuarioPayload>(`${this.apiUrl}/usuarios/${id}`);
  }

  public criarUsuario(payload: UsuarioPayload): Observable<UsuarioPayload> {
    return this.http.post<UsuarioPayload>(`${this.apiUrl}/usuarios`, payload);
  }

  public atualizarUsuario(id: number, payload: Partial<UsuarioPayload>): Observable<UsuarioPayload> {
    return this.http.patch<UsuarioPayload>(`${this.apiUrl}/usuarios/${id}`, payload);
  }

  public deletarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  // --- DESPESAS ---
  public getDespesas(mesReferencia?: string): Observable<Despesa[]> { 
    let params = new HttpParams();
    if (mesReferencia) {
      params = params.set('mesReferencia', mesReferencia);
    }
    return this.http.get<Despesa[]>(`${this.apiUrl}/despesas`, { params }); 
  }
  
  public getDespesaById(id: number): Observable<Despesa> { 
    return this.http.get<Despesa>(`${this.apiUrl}/despesas/${id}`); 
  }
  
  public criarDespesa(payload: Partial<Despesa>): Observable<Despesa> { 
    return this.http.post<Despesa>(`${this.apiUrl}/despesas`, payload); 
  }
  
  public atualizarDespesa(id: number, payload: Partial<Despesa>): Observable<Despesa> { 
    return this.http.patch<Despesa>(`${this.apiUrl}/despesas/${id}`, payload); 
  }
  
  public deletarDespesa(id: number): Observable<void> { 
    return this.http.delete<void>(`${this.apiUrl}/despesas/${id}`); 
  }

  // --- RECEITAS ---
  public getReceitas(mesReferencia?: string): Observable<Receita[]> { 
    let params = new HttpParams();
    if (mesReferencia) {
      params = params.set('mesReferencia', mesReferencia);
    }
    return this.http.get<Receita[]>(`${this.apiUrl}/receitas`, { params }); 
  }
  
  public getReceitaById(id: number): Observable<Receita> { 
    return this.http.get<Receita>(`${this.apiUrl}/receitas/${id}`); 
  }
  
  public criarReceita(payload: Partial<Receita>): Observable<Receita> { 
    return this.http.post<Receita>(`${this.apiUrl}/receitas`, payload); 
  }
  
  public atualizarReceita(id: number, payload: Partial<Receita>): Observable<Receita> { 
    return this.http.patch<Receita>(`${this.apiUrl}/receitas/${id}`, payload); 
  }
  
  public deletarReceita(id: number): Observable<void> { 
    return this.http.delete<void>(`${this.apiUrl}/receitas/${id}`); 
  }

  // --- COBRANÇAS (Rateios / Pagamentos) ---
  public getCobrancas(unidadeId?: number, status?: 'PENDENTE' | 'PAGO'): Observable<Cobranca[]> {
    let params = new HttpParams();
    if (unidadeId) params = params.set('unidadeId', unidadeId.toString());
    if (status) params = params.set('status', status);

    return this.http.get<Cobranca[]>(`${this.apiUrl}/cobrancas`, { params });
  }

  public getCobrancaById(id: number): Observable<Cobranca> {
    return this.http.get<Cobranca>(`${this.apiUrl}/cobrancas/${id}`);
  }

  public registrarPagamentoCobranca(id: number, urlComprovantePix: string, dataPagamento: string): Observable<Cobranca> {
    const payload = { urlComprovantePix, dataPagamento };
    return this.http.patch<Cobranca>(`${this.apiUrl}/cobrancas/${id}/pagar`, payload);
  }

  // --- FECHAMENTOS / RATEIOS ---
  public processarFechamento(payload: { 
    mesAnoCompetencia: string; 
    saldoAnteriorCaixa: number; 
    fundoReservaAdicionado: number; 
    dataVencimento: string 
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/fechamentos/processar`, payload);
  }

   public getHistoricoFechamentos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fechamentos`);
  }

  // --- GESTÃO DE UNIDADES ---
  public getUnidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/unidades`);
  }

  public getUnidadeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unidades/${id}`);
  }

  public atualizarUnidade(id: number, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/unidades/${id}`, payload);
  }

  // --- OUVIDORIA / OCORRÊNCIAS ---
  public getOcorrencias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ocorrencias`);
  }

  public criarOcorrencia(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ocorrencias`, payload);
  }

  public atualizarStatusOcorrencia(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/ocorrencias/${id}/status`, { status });
  }

  public deletarOcorrencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ocorrencias/${id}`);
  }
  
  // --- AUDITORIA / LOGS ---
  public getLogsAuditoria(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auditoria`);
  }

  public registrarLog(acao: string): Observable<any> {
    const userId = 1; // Ajuste para pegar do seu AuthService
    return this.http.post(`${this.apiUrl}/auditoria`, { usuarioId: userId, acao });
  }

  // --- MURAL DIGITAL (REGRAS) ---
  public getRegras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/regras`);
  }

  public criarRegra(regra: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/regras`, regra);
  }

  public atualizarRegra(id: number, regra: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/regras/${id}`, regra);
  }

  public deletarRegra(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/regras/${id}`);
  }
  
  // --- Avaliação de Sistema ---
  public enviarAvaliacao(payload: { tipo: string, nota: number, comentario: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/avaliacoes`, payload);
  }

  // --- MANUTENÇÕES PREVENTIVAS ---
  public getManutencoes(): Observable<ManutencaoPayload[]> {
    return this.http.get<ManutencaoPayload[]>(`${this.apiUrl}/manutencoes`);
  }

  public getManutencaoById(id: number): Observable<ManutencaoPayload> {
    return this.http.get<ManutencaoPayload>(`${this.apiUrl}/manutencoes/${id}`);
  }

  public criarManutencao(payload: ManutencaoPayload): Observable<ManutencaoPayload> {
    return this.http.post<ManutencaoPayload>(`${this.apiUrl}/manutencoes`, payload);
  }

  public atualizarManutencao(id: number, payload: Partial<ManutencaoPayload>): Observable<ManutencaoPayload> {
    return this.http.patch<ManutencaoPayload>(`${this.apiUrl}/manutencoes/${id}`, payload);
  }

  public deletarManutencao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/manutencoes/${id}`);
  }
}