import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowcaseService } from './showcase.service';

@Injectable({ providedIn: 'root' })
export class TariffService {
  private base = '/api/v1/tariffs';

  constructor(
    private http: HttpClient,
    private showcaseService: ShowcaseService
  ) {}

  list(): Observable<any> {
    const params = this.showcaseService.isShowcaseActive ? new HttpParams().set('demo', 'true') : undefined;
    return this.http.get<any>(this.base, { params });
  }


  create(data: any): Observable<any> {
    return this.http.post<any>(this.base, data);
  }

  activate(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/activate`, {});
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
