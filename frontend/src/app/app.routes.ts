import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'termos',
    loadComponent: () => import('./features/auth/termos/termos.component').then((m) => m.TermosComponent),
  },
  {
    path: 'sindico',
    loadComponent: () => import('./features/dashboard/sindico/sindico.component').then((m) => m.SindicoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'morador',
    loadComponent: () => import('./features/dashboard/morador/morador.component').then((m) => m.MoradorComponent),
    canActivate: [authGuard],
  },
  {
    path: 'lancamento',
    loadComponent: () => import('./features/financeiro/lancamento/lancamento.component').then((m) => m.LancamentoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'rateio',
    loadComponent: () => import('./features/financeiro/rateio/rateio.component').then((m) => m.RateioComponent),
    canActivate: [authGuard],
  },
  {
    path: 'consolidacao',
    loadComponent: () => import('./features/financeiro/consolidacao/consolidacao.component').then((m) => m.ConsolidacaoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'unidades',
    loadComponent: () => import('./features/admin/unidades/unidades.component').then((m) => m.UnidadesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'editar-unidade/:id',
    loadComponent: () => import('./features/admin/unidades/editar-unidades/editar-unidades.component').then(m => m.EditarUnidadesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'ouvidoria-sindico',
    loadComponent: () => import('./features/comunicacao/ouvidoria-sindico/ouvidoria-sindico.component').then(m => m.OuvidoriaSindicoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'ouvidoria-morador',
    loadComponent: () => import('./features/comunicacao/ouvidoria-morador/ouvidoria-morador.component').then(m => m.OuvidoriaMoradorComponent),
    canActivate: [authGuard],
  },
  {
    path: 'auditoria',
    loadComponent: () => import('./features/admin/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
    canActivate: [authGuard],
  },
  {
    path: 'prestacao-contas',
    loadComponent: () => import('./features/financeiro/prestacao-contas/prestacao-contas.component').then(m => m.PrestacaoContasComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mural',
    loadComponent: () => import('./features/comunicacao/mural/mural.component').then(m => m.MuralComponent),
    canActivate: [authGuard],
  },
  {
    path: 'feedback',
    loadComponent: () => import('./features/comunicacao/feedback/feedback.component').then(m => m.FeedbackComponent),
    canActivate: [authGuard],
  },
  {
    path: 'cadastro-usuario',
    loadComponent: () => import('./features/admin/unidades/cadastro-usuario/cadastro-usuario.component').then(m => m.CadastroUsuarioComponent),
    canActivate: [authGuard],
  },
  {
    path: 'manutencoes',
    loadComponent: () => import('./features/admin/manutencoes/manutencoes.component').then(m => m.ManutencoesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'manutencoes/form',
    loadComponent: () => import('./features/admin/manutencoes/manutencoes-form/manutencoes-form.component').then(m => m.ManutencoesFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'manutencoes/form/:id',
    loadComponent: () => import('./features/admin/manutencoes/manutencoes-form/manutencoes-form.component').then(m => m.ManutencoesFormComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  }
];