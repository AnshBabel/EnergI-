import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShowcaseService {
  private readonly STORAGE_KEY = 'energi_showcase_mode';
  private showcaseSubject = new BehaviorSubject<boolean>(this.getInitialState());
  
  showcaseMode$ = this.showcaseSubject.asObservable();

  constructor() {}

  private getInitialState(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  toggleShowcaseMode(): void {
    const newState = !this.showcaseSubject.value;
    this.showcaseSubject.next(newState);
    localStorage.setItem(this.STORAGE_KEY, newState ? 'true' : 'false');
  }

  get isShowcaseActive(): boolean {
    return this.showcaseSubject.value;
  }
}
