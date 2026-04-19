import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { AppLayoutComponent } from '../../../components/layout/app-layout/app-layout.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, AppLayoutComponent],
  template: `
    <app-app-layout>
      <div class="page-header" [@fadeInUp]>
        <h1>Notifications & Alerts</h1>
        <p>Stay updated with all billing and account communications.</p>
      </div>

      <div *ngIf="loading" class="flex-center" style="height: 300px;">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!loading && notifications.length === 0" class="empty-state" [@fadeInUp]>
        <div class="icon">🔔</div>
        <h3>All caught up!</h3>
        <p>Your notification inbox is empty. We'll alert you here when new bills are generated.</p>
      </div>

      <div *ngIf="!loading && notifications.length > 0" class="notif-list" [@staggerList]>
        <div *ngFor="let notif of notifications" class="notif-item stagger-item" [ngClass]="notif.status.toLowerCase()">
          <div class="notif-icon">
            <span *ngIf="notif.type === 'BILL_GENERATED'">📄</span>
            <span *ngIf="notif.type === 'PAYMENT_SUCCESS'">✅</span>
            <span *ngIf="notif.type === 'PAYMENT_OVERDUE'">⚠️</span>
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <span class="type-badge">{{ notif.type.replace('_', ' ') }}</span>
              <span class="date">{{ notif.createdAt | date:'medium' }}</span>
            </div>
            <h3 class="notif-title">{{ getTitle(notif) }}</h3>
            <p class="notif-message">{{ getMessage(notif) }}</p>
            <div class="notif-footer" *ngIf="notif.error">
              <span class="error-msg">⚠️ Delivery Issue: {{ notif.error }}</span>
            </div>
          </div>
          <div class="notif-status">
            <span class="status-dot" [title]="notif.status"></span>
          </div>
        </div>
      </div>
    </app-app-layout>
  `,
  styles: [`
    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .notif-item {
      display: flex;
      gap: 20px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      transition: all 0.3s ease;
      position: relative;
    }
    .notif-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }
    .notif-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .notif-content {
      flex: 1;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .type-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(124, 58, 237, 0.1);
      color: #a78bfa;
    }
    .date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    .notif-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--color-text);
    }
    .notif-message {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      line-height: 1.5;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .sent .status-dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
    .failed .status-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
    .error-msg {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 8px;
      display: block;
    }
  `],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerList', [
      transition(':enter', [
        query('.stagger-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  loading = true;

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notifService.listAll().subscribe({
      next: (res) => {
        this.notifications = res.notifications;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.loading = false;
      }
    });
  }

  getTitle(notif: any): string {
    switch (notif.type) {
      case 'BILL_GENERATED': return 'New Bill Generated';
      case 'PAYMENT_SUCCESS': return 'Payment Confirmation';
      case 'PAYMENT_OVERDUE': return 'Overdue Payment Alert';
      default: return 'Account Alert';
    }
  }

  getMessage(notif: any): string {
    const payload = notif.payload || {};
    switch (notif.type) {
      case 'BILL_GENERATED': 
        return `A new bill of ${payload.amount} has been generated for your account.`;
      case 'PAYMENT_SUCCESS': 
        return `We have received your payment of ${payload.amount}. Thank you!`;
      case 'PAYMENT_OVERDUE': 
        return `Your bill is currently overdue. Please clear your balance to avoid service interruption.`;
      default: return 'You have a new message regarding your account.';
    }
  }
}
