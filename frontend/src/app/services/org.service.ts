import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrgService {
  private base = '/api/v1/org';

  constructor(private http: HttpClient) {}

  getBranding(): Observable<any> {
    return this.http.get<any>(`${this.base}/branding`);
  }

  updateBranding(data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/branding`, data);
  }
}
