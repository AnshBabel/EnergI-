import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('accessToken');
  const router = inject(Router);
  const http = inject(HttpClient);
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
  } else {
    authReq = req.clone({ withCredentials: true });
  }


  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Avoid infinite loop if refresh also fails with 401
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !(req as any)['_retry']) {
        (req as any)['_retry'] = true;
        return http.post<any>('/api/v1/auth/refresh', {}, { withCredentials: true }).pipe(
          switchMap((data) => {
            localStorage.setItem('accessToken', data.accessToken);
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${data.accessToken}` },
              withCredentials: true,
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            localStorage.removeItem('accessToken');
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

