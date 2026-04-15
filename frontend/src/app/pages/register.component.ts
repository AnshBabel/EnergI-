import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('formChange', [
      transition('* => *', [
        animate('0.2s ease-in-out', style({ opacity: 0, transform: 'translateX(5px)' })),
        animate('0.2s ease-in-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  styles: [`
    .role-selector {
      display: flex;
      gap: 12px;
      background: var(--color-surface-2);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--color-border);
    }
    .role-btn {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .role-btn.active {
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .role-btn.admin.active { color: var(--color-primary-light); }
    .role-btn.consumer.active { color: #10B981; }
    .admin-btn { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); }
    .consumer-btn { background: linear-gradient(135deg, #10B981, #059669); }
  `]
})
export class RegisterComponent {
  role: 'ADMIN' | 'CONSUMER' = 'ADMIN';
  step = 1;
  form = {
    orgName: '',
    orgSlug: '',
    contactEmail: '',
    name: '',
    email: '',
    password: ''
  };
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onOrgNameChange(): void {
    const autoSlug = this.generateSlug(this.form.orgName);
    // Auto-fill if slug is empty or was previously auto-filled (detectable by comparing current slug to a slug of previous name versions)
    // To keep it simple: if it's currently empty or looks like a typical slugified version, we update it
    if (!this.form.orgSlug || /^[a-z0-9-]*$/.test(this.form.orgSlug)) {
      this.form.orgSlug = autoSlug;
    }
  }

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.fillDemoData();
    }
  }

  private fillDemoData() {
    this.form = {
      orgName: 'EnergI Green Society',
      orgSlug: 'energi-green',
      contactEmail: 'admin@energi-green.com',
      name: 'John EnergI',
      email: 'john@energi.com',
      password: 'Password123!'
    };
    this.step = 1;
  }

  onSlugChange(): void {
    this.form.orgSlug = this.form.orgSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  handleSubmit(e: Event): void {
    e.preventDefault();
    if (this.role === 'ADMIN' && this.step === 1) {
      if (!this.form.orgName || !this.form.orgSlug || !this.form.contactEmail) {
        this.error = 'Please fill all organization details';
        return;
      }
      this.step = 2;
      this.error = '';
      return;
    }

    this.error = '';
    this.loading = true;

    // For consumer registration, we need to check if we have a specific endpoint or use existing one
    // Given the current backend, we'll try to register
    this.authService.register({ ...this.form, role: this.role }).subscribe({
      next: (data) => {
        const route = data.user.role === 'ADMIN' ? '/admin/dashboard' : '/consumer/dashboard';
        this.router.navigate([route]);
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed. Check your data.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
