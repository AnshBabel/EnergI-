import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowcaseService } from './showcase.service';

@Injectable({ providedIn: 'root' })
export class BillService {
  private base = '/api/v1/bills';

  constructor(
    private http: HttpClient,
    private showcaseService: ShowcaseService
  ) {}

  listMy(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.base}/my`, { params: httpParams });
  }

  listAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.base, { params: httpParams });
  }

  generate(userId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/user/${userId}`, data);
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  analytics(): Observable<any> {
    return this.http.get<any>(`${this.base}/analytics`);
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history`);
  }

  getMyHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/my-history`);
  }

  pdfUrl(id: string): string {
    const token = localStorage.getItem('accessToken');
    return `/api/v1/bills/${id}/pdf?token=${token}`;
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.base}/export`, { responseType: 'blob' });
  }

  runCycle(month: number, year: number): Observable<any> {
    return this.http.post<any>(`${this.base}/run-cycle`, { month, year });
  }

  getIntelligence(): Observable<any> {
    const params = this.showcaseService.isShowcaseActive ? new HttpParams().set('demo', 'true') : undefined;
    return this.http.get<any>(`${this.base}/my-intelligence`, { params });
  }
}
