import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, catchError, filter, from, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rotasSemToken = ['/auth/login', '/auth/refresh'];
  const naoEnviarToken = rotasSemToken.some(path => req.url.includes(path));

  const rotasSemRefresh = ['/auth/login', '/auth/refresh', '/auth/logout', '/auditoria'];
  const naoRenovar = rotasSemRefresh.some(path => req.url.includes(path));

  return from(Preferences.get({ key: 'accessToken' })).pipe(
    switchMap(({ value: accessToken }) => {
      let clonedRequest = req;

      if (accessToken && !naoEnviarToken) {
        clonedRequest = req.clone({
          setHeaders: { Authorization: `Bearer ${accessToken}` }
        });
      }

      return next(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          
          if (error.status === 401 && !naoRenovar) {
            
            if (!isRefreshing) {
              isRefreshing = true;
              refreshTokenSubject.next(null); 

              return from(authService.getRefreshToken()).pipe(
                switchMap((refreshToken) => {
                  
                  if (!refreshToken) {
                    isRefreshing = false;
                    authService.logout(true); 
                    router.navigate(['/login']);
                    return throwError(() => new Error('Sessão expirada. Nenhum token encontrado.'));
                  }

                  return authService.renovarSessao(refreshToken).pipe(
                    switchMap((novosTokens) => {
                      isRefreshing = false;
                      refreshTokenSubject.next(novosTokens.accessToken); 
                      
                      return next(req.clone({
                        setHeaders: { Authorization: `Bearer ${novosTokens.accessToken}` }
                      }));
                    }),
                    catchError((refreshError) => {
                      isRefreshing = false;
                      authService.logout(true); 
                      router.navigate(['/login']);
                      return throwError(() => refreshError);
                    })
                  );
                })
              );
            } else {
              return refreshTokenSubject.pipe(
                filter(token => token != null), 
                take(1), 
                switchMap(jwt => {
                  return next(req.clone({
                    setHeaders: { Authorization: `Bearer ${jwt}` }
                  }));
                })
              );
            }
          }

          return throwError(() => error);
        })
      );
    })
  );
};