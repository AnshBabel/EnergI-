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

  private getParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    if (this.showcaseService.isShowcaseActive) {
      httpParams = httpParams.set('demo', 'true');
    }
    return httpParams;
  }

  listMy(params?: any): Observable<any> {
    return this.http.get<any>(`${this.base}/my`, { params: this.getParams(params) });
  }

  listAll(params?: any): Observable<any> {
    return this.http.get<any>(this.base, { params: this.getParams(params) });
  }

  generate(userId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/user/${userId}`, data);
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`, { params: this.getParams() });
  }

  analytics(): Observable<any> {
    return this.http.get<any>(`${this.base}/analytics`, { params: this.getParams() });
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history`, { params: this.getParams() });
  }

  getMyHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/my-history`, { params: this.getParams() });
  }

  pdfUrl(id: string): string {
    const token = localStorage.getItem('accessToken');
    let url = `/api/v1/bills/${id}/pdf?token=${token}`;
    if (this.showcaseService.isShowcaseActive) url += '&demo=true';
    return url;
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.base}/export`, { 
      params: this.getParams(),
      responseType: 'blob' 
    });
  }

  runCycle(month: number, year: number): Observable<any> {
    return this.http.post<any>(`${this.base}/run-cycle`, { month, year }, { params: this.getParams() });
  }

  getIntelligence(): Observable<any> {
    return this.http.get<any>(`${this.base}/my-intelligence`, { params: this.getParams() });
  }
}

