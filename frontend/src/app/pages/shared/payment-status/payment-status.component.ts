import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AppLayoutComponent } from '../../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, RouterLink, AppLayoutComponent],
  template: `
    <app-app-layout>
      <div class="status-container" [@fadeUp]>
        <div class="status-card" [class.success]="isSuccess" [class.error]="!isSuccess">
          <div class="status-icon-wrapper">
            <div class="status-icon" *ngIf="isSuccess">✓</div>
            <div class="status-icon" *ngIf="!isSuccess">✕</div>
            <div class="pulse-ring"></div>
          </div>

          <div class="demo-badge" *ngIf="isDemo">
            <span class="sparkle">✨</span> Showcase Mode Active
          </div>

          <h1 class="status-title">{{ isSuccess ? 'Payment Successful!' : 'Payment Cancelled' }}</h1>
          <p class="status-message">
            {{ isSuccess 
              ? (isDemo ? 'Showcase simulation complete. In a live environment, the bill would now be marked as PAID and a receipt generated.' : 'Thank you for your payment. Your bill has been updated and a receipt has been sent to your email.')
              : 'The payment process was cancelled. No charges were made to your account.' }}
          </p>

          <div class="details-box" *ngIf="sessionId && isSuccess">
            <span class="label">Session ID:</span>
            <span class="value">{{ sessionId }}</span>
          </div>

          <div class="actions">
            <button class="btn btn-primary" routerLink="/consumer/bills">
              {{ isSuccess ? 'View Bills' : 'Try Again' }}
            </button>
            <button class="btn btn-ghost" routerLink="/consumer/dashboard">Back to Dashboard</button>
          </div>
        </div>
      </div>
    </app-app-layout>
  `,
  styles: [`
    .status-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 20px;
    }
    .status-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 48px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .status-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
    }
    .status-card.success::before { background: linear-gradient(90deg, #10B981, #34D399); }
    .status-card.error::before { background: linear-gradient(90deg, #EF4444, #F87171); }

    .demo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
      padding: 6px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .sparkle { font-size: 14px; }

    .status-icon-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .status-icon {
      font-size: 40px;
      font-weight: 700;
      z-index: 2;
    }
    .success .status-icon { color: #10B981; }
    .error .status-icon { color: #EF4444; }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.1;
      animation: pulse 2s infinite;
    }

    .status-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 12px;
      background: linear-gradient(to right, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .status-message {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .details-box {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
      font-size: 12px;
      margin-bottom: 32px;
      border: 1px solid rgba(255,255,255,0.03);
    }
    .details-box .label { color: #64748b; }
    .details-box .value { color: #7C3AED; }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn {
      padding: 14px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      border: none;
    }
    .btn-primary {
      background: var(--color-primary);
      color: white;
      box-shadow: 0 8px 16px rgba(124, 58, 237, 0.2);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px rgba(124, 58, 237, 0.3);
    }
    .btn-ghost {
      background: transparent;
      color: #94a3b8;
    }
    .btn-ghost:hover {
      color: white;
      background: rgba(255,255,255,0.05);
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.2; }
      50% { transform: scale(1.1); opacity: 0.1; }
      100% { transform: scale(0.9); opacity: 0.2; }
    }
  `],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PaymentStatusComponent implements OnInit {
  isSuccess = false;
  isDemo = false;
  sessionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isSuccess = params['success'] === 'true';
      this.isDemo = params['demo'] === 'true';
      this.sessionId = params['session_id'] || null;
    });
  }
}
