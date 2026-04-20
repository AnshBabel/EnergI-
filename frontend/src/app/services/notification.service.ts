import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowcaseService } from './showcase.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = '/api/v1/notifications';

  constructor(
    private http: HttpClient,
    private showcaseService: ShowcaseService
  ) {}

  listAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    if (this.showcaseService.isShowcaseActive) {
      httpParams = httpParams.set('demo', 'true');
    }

    return this.http.get<any>(this.base, { params: httpParams });
  }
}

