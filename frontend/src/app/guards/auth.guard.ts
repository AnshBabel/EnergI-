import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from '../state/auth.state';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthState);
  const router = inject(Router);

  return authState.loading$.pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (authState.user) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
