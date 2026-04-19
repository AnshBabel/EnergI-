import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { PaymentService } from '../../services/payment.service';
import { AuthState, User } from '../../state/auth.state';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { Chart, registerables } from 'chart.js';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { forkJoin, Subscription } from 'rxjs';
import { ShowcaseService } from '../../services/showcase.service';

Chart.register(...registerables);

@Component({
  selector: 'app-consumer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppLayoutComponent],
  templateUrl: './dashboard.component.html',
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
  ],
  styles: [`
    .trend-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .trend-up { background: rgba(239, 68, 68, 0.1); color: var(--color-danger); }
    .trend-down { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
    .insight-card { border-left: 4px solid var(--color-primary); background: linear-gradient(90deg, rgba(124, 58, 237, 0.05) 0%, transparent 100%); }
    .pulse-glow { animation: pulse-glow 2s infinite; }
  `]
})
export class DashboardComponent implements OnInit {
  @ViewChild('usageChart') usageChart!: ElementRef<HTMLCanvasElement>;

  user: User | null = null;
  bills: any[] = [];
  intelligence: any = null;
  history: any[] = [];
  loading = true;
  loadingIntel = true;
  paying: string | null = null;
  chart: any;
  private sub = new Subscription();

  constructor(
    private authState: AuthState,
    public billService: BillService,
    private paymentService: PaymentService,
    private showcaseService: ShowcaseService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.authState.user$.subscribe(user => this.user = user));
    
    // Watch for showcase mode toggle
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(() => {
      this.loadDashboard();
    }));
  }

  loadDashboard(): void {
    this.loading = true;
    this.loadingIntel = true;

    forkJoin({
      bills: this.billService.listMy({ limit: 3 }),
      intel: this.billService.getIntelligence()
    }).subscribe({
      next: (res) => {
        this.bills = res.bills.bills || [];
        this.intelligence = res.intel;
        if (this.intelligence.hasHistory) {
          this.history = this.intelligence.history;
        }
      },
      error: (err) => console.error(err),
      complete: () => {
        this.loading = false;
        this.loadingIntel = false;
        // Wait for DOM to settle
        setTimeout(() => this.initChart(), 500);
      }
    });
  }

  initChart(): void {
    if (!this.usageChart || !this.history.length) return;
    const ctx = this.usageChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.history.map(h => h.period);
    const data = this.history.map(h => h.units);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'kWh Consumed',
          data: data,
          borderColor: '#10B981', // Success green for consumer
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' }
          },
          x: { 
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  get latestBill(): any {
    return this.bills[0];
  }

  get isOverdue(): boolean {
    if (!this.latestBill || this.latestBill.status !== 'UNPAID') return false;
    return new Date(this.latestBill.dueDate) < new Date();
  }

  handlePay(billId: string): void {
    this.paying = billId;
    this.paymentService.checkout(billId).subscribe({
      next: (data) => {
        window.location.href = data.url;
      },
      error: (err) => {
        alert(err.error?.error || 'Payment failed to initialize');
        this.paying = null;
      }
    });
  }

  formatAmount(paise: number): string {
    if (!paise && paise !== 0) return '₹0.00';
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  isEligibleForEarlyBird(bill: any): boolean {
    if (!bill?.earlyBird?.eligibleUntil || bill.status !== 'UNPAID') return false;
    return new Date() <= new Date(bill.earlyBird.eligibleUntil);
  }
}
