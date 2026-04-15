import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TariffService {
  private base = '/api/v1/tariffs';

  constructor(private http: HttpClient) {}

  list(): Observable<any> {
    return this.http.get<any>(this.base);
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
