import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DisputeService {
  private base = '/api/v1/disputes';

  constructor(private http: HttpClient) {}

  raise(billId: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.base}/bill/${billId}`, { reason });
  }

  listMy(): Observable<any> {
    return this.http.get<any>(`${this.base}/my`);
  }

  listAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.base, { params: httpParams });
  }

  resolve(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/resolve`, data);
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/status`, { status });
  }
}
