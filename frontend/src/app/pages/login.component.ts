import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
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
    .role-btn.admin.active {
      color: var(--color-primary-light);
    }
    .role-btn.consumer.active {
      color: #10B981; /* Success green */
    }
    .admin-btn {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    }
    .consumer-btn {
      background: linear-gradient(135deg, #10B981, #059669);
    }
  `]
})
export class LoginComponent {
  role: 'ADMIN' | 'CONSUMER' = 'CONSUMER'; // Default to Consumer for "Stealth" feels
  form = { email: '', password: '', orgSlug: '' };
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Stealth shortcut: Ctrl/Cmd + Shift + A (Admin)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      this.setRole('ADMIN');
      console.log('⚡ Stealth Admin Portal Activated');
    }
  }

  setRole(role: 'ADMIN' | 'CONSUMER'): void {
    this.role = role;
    this.error = '';
  }

  handleSubmit(e: Event): void {
    e.preventDefault();
    this.error = '';
    this.loading = true;

    this.authService.login(this.form).subscribe({
      next: (data) => {
        // Validation: Ensure the role matched the expected one
        if (data.user.role !== this.role) {
          this.error = `This account is a ${data.user.role} account. Please use the correct tab.`;
          this.loading = false;
          return;
        }
        const route = data.user.role === 'ADMIN' ? '/admin/dashboard' : '/consumer/dashboard';
        this.router.navigate([route]);
      },
      error: (err) => {
        this.error = err.error?.error || 'Login failed. Check your credentials.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
