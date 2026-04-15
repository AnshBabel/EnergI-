import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('accessToken');
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
  } else {
    authReq = req.clone({ withCredentials: true });
  }

  const http = inject(HttpClient);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !(req as any)['_retry']) {
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
          catchError(() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
