import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, AppLayoutComponent],
  template: `
    <app-app-layout>
      <div class="page-header" [@fadeInUp]>
        <div>
          <h1 class="page-title">Payment Transactions</h1>
          <p class="page-subtitle">Track and manage all revenue streams</p>
        </div>
      </div>

      <div class="stats-grid mb-8" [@staggerList]>
        <div class="stat-card stagger-item">
          <div class="stat-label">Successful Payments</div>
          <div class="stat-value">{{ totalPayments }}</div>
        </div>
        <div class="stat-card stagger-item">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value text-primary">{{ formatAmount(totalRevenue) }}</div>
        </div>
      </div>

      <div class="card" [@fadeInUp]>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Consumer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payments" class="stagger-item">
                <td>{{ p.createdAt | date:'short' }}</td>
                <td>
                  <div class="user-cell">
                    <span class="name">{{ p.userId?.name }}</span>
                    <span class="email">{{ p.userId?.email }}</span>
                  </div>
                </td>
                <td>{{ formatAmount(p.amountInPaise) }}</td>
                <td>
                  <span class="badge" [class.badge-success]="p.status === 'SUCCESS'" [class.badge-primary]="p.status === 'REFUNDED'">
                    {{ p.status }}
                  </span>
                </td>
                <td class="font-mono text-xs">{{ p.stripePaymentIntentId }}</td>
                <td>
                  <button 
                    *ngIf="p.status === 'SUCCESS'" 
                    class="btn btn-outline-danger btn-sm"
                    (click)="handleRefund(p._id)"
                    [disabled]="refunding === p._id"
                  >
                    {{ refunding === p._id ? 'Refunding...' : 'Refund' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </app-app-layout>
  `,
  styles: [`
    .user-cell { display: flex; flex-direction: column; }
    .user-cell .name { font-weight: 600; color: var(--color-text); }
    .user-cell .email { font-size: 12px; color: var(--color-text-muted); }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  `],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerList', [
      transition(':enter', [
        query('.stagger-item', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(100, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AdminPaymentsComponent implements OnInit {
  payments: any[] = [];
  totalPayments = 0;
  totalRevenue = 0;
  loading = true;
  refunding: string | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.listAll().subscribe({
      next: (res) => {
        this.payments = res.payments;
        this.totalPayments = res.total;
        this.totalRevenue = res.payments
          .filter((p: any) => p.status === 'SUCCESS')
          .reduce((acc: number, p: any) => acc + p.amountInPaise, 0);
      },
      error: (err) => console.error(err),
      complete: () => this.loading = false
    });
  }

  handleRefund(id: string): void {
    if (!confirm('Are you sure you want to refund this payment?')) return;
    this.refunding = id;
    this.paymentService.refund(id).subscribe({
      next: () => {
        alert('Refund processed successfully');
        this.load();
      },
      error: (err) => alert(err.error?.error || 'Refund failed'),
      complete: () => this.refunding = null
    });
  }

  formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}
