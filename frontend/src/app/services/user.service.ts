import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = '/api/v1/users';

  constructor(private http: HttpClient) {}

  list(params?: any): Observable<any> {
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

  create(data: any): Observable<any> {
    return this.http.post<any>(this.base, data);
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}`, data);
  }
}
