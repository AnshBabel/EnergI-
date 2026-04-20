import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowcaseService } from './showcase.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = '/api/v1/payments';

  constructor(
    private http: HttpClient,
    private showcaseService: ShowcaseService
  ) {}

  checkout(billId: string): Observable<any> {
    let url = `${this.base}/checkout/${billId}`;
    if (this.showcaseService.isShowcaseActive) url += '?demo=true';
    return this.http.post<any>(url, {});
  }

  listAll(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    if (this.showcaseService.isShowcaseActive) {
      httpParams = httpParams.set('demo', 'true');
    }

    return this.http.get<any>(`${this.base}/all`, { params: httpParams });
  }


  refund(paymentId: string): Observable<any> {
    let url = `${this.base}/refund/${paymentId}`;
    if (this.showcaseService.isShowcaseActive) url += '?demo=true';
    return this.http.post<any>(url, {});
  }

}
