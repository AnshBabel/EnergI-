import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthState, User, Org } from '../state/auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = '/api/v1/auth';

  constructor(private http: HttpClient, private authState: AuthState) {}

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/register`, data).pipe(
      tap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        this.authState.setUser(res.user);
        this.authState.setOrg(res.org);
        this.applyBranding(res.org);
      })
    );
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/login`, data).pipe(
      tap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        this.authState.setUser(res.user);
        this.authState.setOrg(res.org);
        this.applyBranding(res.org);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.base}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        this.authState.clear();
      })
    );
  }

  me(): Observable<any> {
    return this.http.get<any>(`${this.base}/me`);
  }

  init(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.authState.setLoading(false);
      return;
    }
    Promise.all([
      this.me().toPromise(),
      this.http.get<any>('/api/v1/org/branding').toPromise(),
    ])
      .then(([meData, brandData]) => {
        this.authState.setUser(meData.user);
        this.authState.setOrg(brandData.org);
        this.applyBranding(brandData.org);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      })
      .finally(() => {
        this.authState.setLoading(false);
      });
  }

  private applyBranding(org: Org | null): void {
    if (org?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', org.primaryColor);
    }
  }
}
