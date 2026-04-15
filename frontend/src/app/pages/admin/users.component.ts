import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './users.component.html',
  styles: []
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  showModal = false;
  form = { name: '', email: '', password: '', meterNumber: '', address: '', phone: '' };
  error = '';
  saving = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.load();
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
        this.form = { name: '', email: '', password: '', meterNumber: '', address: '', phone: '' };
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
}
