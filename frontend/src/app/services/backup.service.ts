import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowcaseService } from './showcase.service';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private base = '/api/v1/org/backup';

  constructor(
    private http: HttpClient,
    private showcaseService: ShowcaseService
  ) {}

  /**
   * Triggers file download for encrypted backup from server.
   */
  exportBackup(): Observable<Blob> {
    const url = `${this.base}/export${this.showcaseService.isShowcaseActive ? '?demo=true' : ''}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Uploads and verifies backup file decryption validity.
   */
  verifyBackup(backupData: any): Observable<any> {
    const url = `${this.base}/verify${this.showcaseService.isShowcaseActive ? '?demo=true' : ''}`;
    return this.http.post<any>(url, { backup: backupData });
  }
}
