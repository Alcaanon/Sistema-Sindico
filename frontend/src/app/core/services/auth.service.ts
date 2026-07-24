import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable, switchMap, tap, map} from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginPayload {
  cpf: string;
  senha: string;
}

export interface UsuarioLogado {
  id: number;
  nomeCompleto: string;
  perfil: string;
  aceiteLgpd: boolean;
  unidadeNumero?: string;
}

export interface LoginResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  usuario: UsuarioLogado; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; 

  private async registrarLogAuditoria(nivel: 'INFO' | 'WARN' | 'ERROR', acao: string, detalhes?: any) {
    try {
      let usuarioId: number | null = null;
      const { value: userStr } = await Preferences.get({ key: 'usuario_dados' });
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) usuarioId = Number(user.id);
        } catch (e) {}
      }

      if (!usuarioId) return; 

      let mensagemLog = `[Frontend] [${nivel}] ${acao}`;
      if (detalhes) {
        const detalhesStr = typeof detalhes === 'object' ? JSON.stringify(detalhes) : detalhes;
        mensagemLog += ` | Detalhes: ${detalhesStr}`;
      }

      this.http.post(`${this.apiUrl}/auditoria`, { usuarioId, acao: mensagemLog }).subscribe({
        next: () => {}, error: () => {} 
      });
    } catch (e) {}
  }

  public login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      switchMap(async (response) => {
        await this.salvarDadosLogin(response);
        return response; 
      })
    );
  }

  public atualizarUsuario(id: number, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${id}`, payload);
  }

  private async salvarDadosLogin(response: LoginResponse): Promise<void> {
    const tokenAcesso = response.accessToken || response.access_token;
    const tokenRefresh = response.refreshToken || response.refresh_token;

    if (!tokenAcesso || !tokenRefresh) {
      console.error('[ERRO GRAVE] O Backend não enviou os tokens esperados no Login!', response);
    }

    await Preferences.set({ key: 'accessToken', value: tokenAcesso || '' });
    await Preferences.set({ key: 'refreshToken', value: tokenRefresh || '' });
    await Preferences.set({ key: 'usuario_dados', value: JSON.stringify(response.usuario || {}) });
    
    this.registrarLogAuditoria('INFO', 'Login bem-sucedido e credenciais persistidas.');
  }

  public async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'accessToken' });
    return value;
  }

  public async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'refreshToken' });
    return value;
  }

  public async getUserData(): Promise<UsuarioLogado | null> {
    const { value } = await Preferences.get({ key: 'usuario_dados' });
    if (!value) return null;
    try {
      return JSON.parse(value) as UsuarioLogado;
    } catch {
      return null;
    }
  }

  public async getUsuarioIdSeguro(): Promise<number> {
    const { value: userStr } = await Preferences.get({ key: 'usuario_dados' });
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) return Number(user.id);
      } catch (e) {}
    }

    const { value: token } = await Preferences.get({ key: 'accessToken' });
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = JSON.parse(atob(payloadBase64));
        if (payloadJson.id || payloadJson.sub) {
          return Number(payloadJson.id || payloadJson.sub);
        }
      } catch (e) {}
    }

    throw new Error('Sessão inválida');
  }

  public renovarSessao(refreshToken: string): Observable<{ accessToken: string, refreshToken: string }> {
    
    const payload = { refresh_token: refreshToken.trim() }; 
    
    return this.http.post<any>(`${this.apiUrl}/auth/refresh`, payload).pipe(
      tap((response) => {
        const novoAccess = response.accessToken || response.access_token;
        const novoRefresh = response.refreshToken || response.refresh_token;

        if (novoAccess && novoRefresh) {
          Preferences.set({ key: 'accessToken', value: novoAccess });
          Preferences.set({ key: 'refreshToken', value: novoRefresh });
        }
      }),
      map((response) => ({
        accessToken: response.accessToken || response.access_token,
        refreshToken: response.refreshToken || response.refresh_token
      }))
    );
  }

  public async logout(forcarLocal: boolean = false): Promise<void> {
    if (!forcarLocal) {
      this.registrarLogAuditoria('INFO', 'Usuário deslogou manualmente do sistema.');
      try {
        const id = await this.getUsuarioIdSeguro();
        this.http.post(`${this.apiUrl}/auth/logout`, { id }).subscribe({ error: () => {} });
      } catch(e) {}
    }

    await Preferences.remove({ key: 'accessToken' });
    await Preferences.remove({ key: 'refreshToken' });
    await Preferences.remove({ key: 'usuario_dados' });
  }
}