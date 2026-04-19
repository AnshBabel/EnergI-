import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = '/api/v1/payments';

  constructor(private http: HttpClient) {}

  checkout(billId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/checkout/${billId}`, {});
  }

  listAll(params: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/all`, { params });
  }

  refund(paymentId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/refund/${paymentId}`, {});
  }
}
