import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ShowcaseService } from '../../services/showcase.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './users.component.html',
  styles: []
})
export class UsersComponent implements OnInit, OnDestroy {
  users: any[] = [];
  loading = true;
  showModal = false;
  private sub = new Subscription();
  form = { 
    name: '', 
    email: '', 
    password: '', 
    meterNumber: '', 
    address: '', 
    phone: '',
    isSmartMeterEnabled: false,
    consumptionRate: 0.2
  };
  error = '';
  saving = false;

  constructor(
    private userService: UserService,
    private showcaseService: ShowcaseService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(() => {
      this.load();
    }));
  }

  load(): void {
    this.loading = true;
    this.userService.list().subscribe({
      next: (data) => {
        this.users = data.users || [];
      },
      error: (err) => {
        console.error('Failed to load users', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleCreate(e: Event): void {
    e.preventDefault();
    this.error = '';
    this.saving = true;
    this.userService.create(this.form).subscribe({
      next: () => {
        this.showModal = false;
        this.form = { 
          name: '', email: '', password: '', meterNumber: '', address: '', phone: '',
          isSmartMeterEnabled: false, consumptionRate: 0.2
        };
        this.load();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to create consumer';
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}

