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
        style({ opacity: 0, transform: 'translateX(10px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  styles: [`
    .role-selector { display: flex; gap: 12px; background: var(--color-surface-2); padding: 4px; border-radius: 12px; border: 1px solid var(--color-border); }
    .role-btn { flex: 1; padding: 10px; border-radius: 10px; border: none; background: transparent; color: var(--color-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .role-btn.active { background: var(--color-surface); color: var(--color-text); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .role-btn.admin.active { color: var(--color-primary-light); }
    .role-btn.consumer.active { color: #10B981; }
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
  `]
})
export class RegisterComponent {
  role: 'ADMIN' | 'CONSUMER' = 'ADMIN';
  step = 1;
  
  // Text form data
  form = {
    orgName: '',
    orgSlug: '',
    contactEmail: '',
    footerText: '', // New Field
    name: '',
    email: '',
    password: ''
  };

  // File data
  logoFile: File | null = null;
  signatureFile: File | null = null;

  error = '';
  loading = false;
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // --- File Handlers ---
  onFileChange(event: any, type: 'logo' | 'signature'): void {
    const file = event.target.files[0];
    if (file) {
      if (type === 'logo') this.logoFile = file;
      if (type === 'signature') this.signatureFile = file;
    }
  }

  onOrgNameChange(): void {
    const autoSlug = this.generateSlug(this.form.orgName);
    if (!this.form.orgSlug || /^[a-z0-9-]*$/.test(this.form.orgSlug)) {
      this.form.orgSlug = autoSlug;
    }
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30);
  }

  onSlugChange(): void {
    this.form.orgSlug = this.form.orgSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  handleSubmit(e: Event): void {
    e.preventDefault();
    
    // Step 1 Validation for Admin
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
    // Final Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.form.email)) {
      this.error = 'Invalid email address format';
      this.loading = false;
      return;
    }
    if (this.role === 'ADMIN' && !emailRegex.test(this.form.contactEmail)) {
      this.error = 'Invalid organization contact email';
      this.loading = false;
      return;
    }

    // Use FormData to support file uploads
    const formData = new FormData();
    
    // Append text fields
    Object.keys(this.form).forEach(key => {
      formData.append(key, (this.form as any)[key]);
    });
    formData.append('role', this.role);

    // Append files if they exist
    if (this.logoFile) formData.append('logo', this.logoFile);
    if (this.signatureFile) formData.append('signature', this.signatureFile);

    // Note: Update your AuthService.register to accept FormData instead of JSON
    this.authService.register(formData).subscribe({
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
      footerText: 'Official Bill - Contact support@energi.com for queries',
      name: 'John EnergI',
      email: 'john@energi.com',
      password: 'Password123!'
    };
    this.step = 1;
  }
}