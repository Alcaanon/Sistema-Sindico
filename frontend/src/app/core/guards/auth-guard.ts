import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userData = await authService.getUserData();

  if (userData && userData.id) {
    return true;
  }

  alert('Acesso negado: Você precisa estar logado para acessar esta página.');
  router.navigate(['/login'], { replaceUrl: true });
  return false;
};