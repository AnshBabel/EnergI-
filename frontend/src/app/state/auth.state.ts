import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CONSUMER';
  consumerId?: string;
  meterNumber?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  isSmartMeterEnabled?: boolean;
  lastKnownReading?: number;
  consumptionRate?: number;
  createdAt?: string;
}

export interface Org {
  _id: string;
  name: string;
  slug: string;
  primaryColor?: string;
  contactEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthState {
  private userSubject = new BehaviorSubject<User | null>(null);
  private orgSubject = new BehaviorSubject<Org | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  user$ = this.userSubject.asObservable();
  org$ = this.orgSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  get user(): User | null { return this.userSubject.value; }
  get org(): Org | null { return this.orgSubject.value; }
  get loading(): boolean { return this.loadingSubject.value; }

  setUser(user: User | null) { this.userSubject.next(user); }
  setOrg(org: Org | null) { this.orgSubject.next(org); }
  setLoading(loading: boolean) { this.loadingSubject.next(loading); }

  clear() {
    this.userSubject.next(null);
    this.orgSubject.next(null);
  }
}
