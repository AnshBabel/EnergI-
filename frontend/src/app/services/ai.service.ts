import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnomalyAlert {
  userId?: string;
  userName?: string;
  meterNumber?: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  date: string;
}

export interface PredictiveInsights {
  currentReading: number;
  previousReading: number;
  unitsConsumedSoFar: number;
  projectedUnits: number;
  projectedTotalInPaise: number;
  daysElapsed: number;
  daysTotal: number;
  anomalies: AnomalyAlert[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private base = '/api/v1/ai';

  constructor(private http: HttpClient) {}

  getChatResponse(message: string, demo: boolean = false): Observable<{ response: string }> {
    const params = demo ? new HttpParams().set('demo', 'true') : undefined;
    return this.http.post<{ response: string }>(`${this.base}/chat`, { message }, { params });
  }

  getInsights(demo: boolean = false): Observable<PredictiveInsights> {
    const params = demo ? new HttpParams().set('demo', 'true') : undefined;
    return this.http.get<PredictiveInsights>(`${this.base}/insights`, { params });
  }

  getAdminAnomalies(demo: boolean = false): Observable<{ anomalies: AnomalyAlert[] }> {
    const params = demo ? new HttpParams().set('demo', 'true') : undefined;
    return this.http.get<{ anomalies: AnomalyAlert[] }>(`${this.base}/admin/anomalies`, { params });
  }
}
