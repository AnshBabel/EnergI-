import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private base = '/api/v1/superadmin';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<any> {
    return this.http.get<any>(`${this.base}/overview`);
  }

  getOrganizations(): Observable<any> {
    return this.http.get<any>(`${this.base}/organizations`);
  }

  toggleOrganization(orgId: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/organizations/${orgId}/toggle`, {});
  }

  impersonate(targetUserId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/impersonate`, { targetUserId });
  }

  toggleMaintenanceMode(enabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.base}/maintenance/toggle`, { enabled });
  }

  // MongoDB Explorer Methods
  getMongoCollections(): Observable<any> {
    return this.http.get<any>(`${this.base}/mongodb/collections`);
  }

  getCollectionDocuments(collectionName: string): Observable<any> {
    return this.http.get<any>(`${this.base}/mongodb/collection/${collectionName}`);
  }

  createDocument(collectionName: string, documentData: any): Observable<any> {
    return this.http.post<any>(`${this.base}/mongodb/document/${collectionName}`, documentData);
  }

  updateDocument(collectionName: string, id: string, documentData: any): Observable<any> {
    return this.http.put<any>(`${this.base}/mongodb/document/${collectionName}/${id}`, documentData);
  }

  deleteDocument(collectionName: string, id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/mongodb/document/${collectionName}/${id}`);
  }
}
