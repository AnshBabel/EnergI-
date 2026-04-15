import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from '../state/auth.state';
import { filter, map, take } from 'rxjs';

export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const authState = inject(AuthState);
    const router = inject(Router);

    return authState.loading$.pipe(
      filter(loading => !loading),
      take(1),
      map(() => {
        if (authState.user?.role === requiredRole) {
          return true;
        }
        // Redirect to correct dashboard based on role
        if (authState.user?.role === 'ADMIN') {
          router.navigate(['/admin/dashboard']);
        } else if (authState.user?.role === 'CONSUMER') {
          router.navigate(['/consumer/dashboard']);
        } else {
          router.navigate(['/login']);
        }
        return false;
      })
    );
  };
}
