import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { TenantService, TenantInfo } from '../services/tenant.service';

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
    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: color 0.2s;
    }
    .password-toggle:hover {
      color: var(--color-text);
    }
    .tenant-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      object-fit: contain;
      background: white;
    }
    .superadmin-hud {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(24px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeInHUD 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeInHUD {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    .hud-card {
      width: 420px;
      background: #0f172a;
      border: 1px solid rgba(239, 68, 68, 0.3); /* Neon Red Accent */
      box-shadow: 0 0 60px rgba(239, 68, 68, 0.2);
      border-radius: 24px;
      padding: 32px;
      position: relative;
    }
    .close-hud {
      position: absolute;
      top: 20px; right: 20px;
      background: rgba(255,255,255,0.05);
      border: none;
      color: white;
      width: 32px; height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .close-hud:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    .hud-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .glow-shield {
      font-size: 48px;
      margin-bottom: 12px;
      filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.5));
      animation: pulseHUD 2s infinite;
    }
    @keyframes pulseHUD {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.5)); }
      50% { transform: scale(1.08); filter: drop-shadow(0 0 35px rgba(239, 68, 68, 0.8)); }
    }
    .hud-title {
      color: white;
      font-weight: 800;
      letter-spacing: 2px;
      margin: 0; font-size: 20px;
    }
    .hud-subtitle {
      color: #ef4444; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    }
    .hud-label {
      color: rgba(255,255,255,0.6); font-size: 10px; font-weight: 700; letter-spacing: 1px;
    }
    .hud-input {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: white; padding: 12px 16px; border-radius: 12px; width: 100%; font-size: 14px;
      margin-top: 6px; outline: none; transition: all 0.3s;
    }
    .hud-input:focus {
      border-color: #ef4444; background: rgba(239, 68, 68, 0.05);
    }
    .hud-submit {
      width: 100%; padding: 14px; background: linear-gradient(135deg, #ef4444, #b91c1c);
      color: white; font-weight: 800; letter-spacing: 1.5px; font-size: 13px; border: none;
      border-radius: 14px; cursor: pointer; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
      transition: all 0.3s; margin-top: 12px;
    }
    .hud-submit:hover {
      transform: translateY(-2px); box-shadow: 0 12px 32px rgba(239, 68, 68, 0.6);
    }
  `]
})
export class LoginComponent implements OnInit {
  role: 'ADMIN' | 'CONSUMER' = 'CONSUMER'; 
  form = { email: '', password: '', orgSlug: '' };
  error = '';
  loading = false;
  showPassword = false;
  tenant: TenantInfo | null = null;

  // Super Admin HUD State
  showSuperAdminModal = false;
  superAdminForm = { email: '', password: '' };
  superAdminError = '';
  superAdminLoading = false;
  showSuperPassword = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.tenantService.tenant$.subscribe(t => {
      this.tenant = t;
      if (t) {
        this.form.orgSlug = t.slug;
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleSuperPassword(): void {
    this.showSuperPassword = !this.showSuperPassword;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      this.setRole('ADMIN');
      console.log('⚡ Stealth Admin Portal Activated');
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.showSuperAdminModal = true;
      console.log('👑 Super Admin Security HUD Unlocked');
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

  handleSuperAdminSubmit(e: Event): void {
    e.preventDefault();
    this.superAdminError = '';
    this.superAdminLoading = true;

    this.authService.loginSuperAdmin(this.superAdminForm).subscribe({
      next: (data) => {
        if (data.user.role !== 'SUPER_ADMIN') {
          this.superAdminError = 'Unauthorized access.';
          this.superAdminLoading = false;
          return;
        }
        this.router.navigate(['/superadmin/dashboard']);
      },
      error: (err) => {
        this.superAdminError = err.error?.error || 'Invalid credentials.';
        this.superAdminLoading = false;
      },
      complete: () => {
        this.superAdminLoading = false;
      }
    });
  }
}
