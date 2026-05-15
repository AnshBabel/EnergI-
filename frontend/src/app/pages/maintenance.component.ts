import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthState } from '../state/auth.state';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-wrapper" [@fadeIn]>
      <div class="glass-container">
        <div class="icon-pulse">🛠️</div>
        <h1 class="title">System Upgrade in Progress</h1>
        <p class="description">
          EnergI is currently undergoing scheduled maintenance to improve our grid telemetry systems. 
          We'll be back online with enhanced performance shortly.
        </p>
        
        <div class="status-box">
          <div class="status-item">
            <span class="label">Platform Status:</span>
            <span class="value pulse-text">FROZEN</span>
          </div>
          <div class="status-item">
            <span class="label">Expected Duration:</span>
            <span class="value">~15 Minutes</span>
          </div>
        </div>

        <div class="footer-note">
          Thank you for your patience while we optimize your energy experience.
        </div>

        <button class="retry-btn" (click)="checkConnection()" [disabled]="checking">
          {{ checking ? 'Verifying...' : 'Check Connection' }}
        </button>
      </div>
      <div class="background-glow"></div>
    </div>
  `,
  styles: [`
    .maintenance-wrapper {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: #0f172a; display: flex; align-items: center; justify-content: center;
      z-index: 99999; overflow: hidden; font-family: 'Inter', sans-serif;
    }
    .glass-container {
      width: 100%; max-width: 500px; padding: 48px; text-align: center;
      background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); z-index: 10;
    }
    .icon-pulse { font-size: 64px; margin-bottom: 24px; animation: float 3s ease-in-out infinite; }
    .title { font-size: 28px; font-weight: 800; color: white; margin-bottom: 16px; letter-spacing: -0.5px; }
    .description { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 32px; }
    .status-box {
      background: rgba(0, 0, 0, 0.2); border-radius: 20px; padding: 20px;
      display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;
    }
    .status-item { display: flex; justify-content: space-between; align-items: center; }
    .label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .value { font-size: 14px; font-weight: 700; color: #f1f5f9; }
    .pulse-text { color: #f43f5e; animation: pulse 2s infinite; }
    .footer-note { font-size: 12px; color: #475569; font-weight: 500; margin-bottom: 24px; }
    
    .retry-btn {
      width: 100%; padding: 14px; border-radius: 16px; border: none;
      background: linear-gradient(135deg, #6366f1, #4f46e5); color: white;
      font-weight: 700; cursor: pointer; transition: 0.3s;
    }
    .retry-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); }
    .retry-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .background-glow {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 600px; height: 600px; background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('0.6s cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  checking = false;
  private http = inject(HttpClient);
  private router = inject(Router);
  private autoCheckInterval: any;

  ngOnInit(): void {
    // Auto-check every 15 seconds to see if system is back
    this.autoCheckInterval = setInterval(() => {
      this.checkConnection(true);
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }
  }

  checkConnection(isAuto = false): void {
    if (!isAuto) this.checking = true;
    
    this.http.get('/api/v1/auth/me').subscribe({
      next: (res: any) => {
        this.checking = false;
        const role = res.user?.role;
        const target = role === 'ADMIN' ? '/admin/dashboard' : '/consumer/dashboard';
        this.router.navigate([target]);
      },
      error: () => {
        this.checking = false;
      }
    });
  }
}
    
    .background-glow {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 600px; height: 600px; background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('0.6s cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class MaintenanceComponent {}
