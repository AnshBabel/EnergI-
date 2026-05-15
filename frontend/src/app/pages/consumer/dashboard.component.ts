import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { PaymentService } from '../../services/payment.service';
import { AiService, PredictiveInsights } from '../../services/ai.service';
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
    .welcome-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0; color: var(--color-text); }
    .welcome-subtitle { color: var(--color-text-muted); margin-top: 4px; font-size: 14px; }
    
    .text-warning { color: var(--color-warning) !important; }
    .text-success { color: var(--color-success) !important; }
    .text-danger { color: var(--color-danger) !important; }
    .text-main { color: var(--color-text) !important; }
    .text-success-bold { color: #10B981; font-weight: 700; }
    
    .stat-icon-muted { font-size: 24px; opacity: 0.2; position: absolute; right: 20px; top: 20px; }
    
    .live-meter-card { 
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02)); 
      border: 1px solid rgba(16,185,129,0.3); 
    }
    .live-dot-pulse { width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 10px #10B981; animation: pulseDot 1.5s infinite; }
    .meter-reading { font-family: 'Courier New', monospace; letter-spacing: 2px; color: var(--color-text); }

    .forecast-card { 
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%); 
      border: 1px solid rgba(124, 58, 237, 0.25); 
      position: relative; overflow: hidden;
    }
    .forecast-glow { position: absolute; top: -10px; right: -10px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%); pointer-events: none; }
    .forecast-label { color: var(--color-primary-light); font-weight: 700; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; }
    .forecast-title { margin: 8px 0 4px 0; font-size: 20px; font-weight: 700; color: var(--color-text); }
    .forecast-value { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; color: var(--color-primary-light); }
    
    .cycle-progress-bg { width: 100%; height: 6px; background: var(--color-border); border-radius: 99px; overflow: hidden; }
    .cycle-progress-bar { height: 100%; background: linear-gradient(90deg, #7c3aed, #a78bfa); border-radius: 99px; }

    .telemetry-panel { flex: 1; min-width: 250px; background: var(--color-surface-2); border: 1px solid var(--color-border); padding: 16px; border-radius: 12px; }
    .telemetry-label { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: var(--color-text-muted); text-transform: uppercase; }
    .telemetry-online-badge { background: rgba(16, 185, 129, 0.1); color: #10B981; font-size: 10px; }
    .telemetry-reading { font-family: monospace; color: var(--color-text); }
    
    .telemetry-alerts-section { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--color-border); }
    .telemetry-alert-header { color: var(--color-danger); font-size: 11px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
    .telemetry-alert-box { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; font-size: 11.5px; line-height: 1.4; color: var(--color-text); }

    .bill-hero-card { background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.05)); border: 1px solid rgba(124,58,237,0.3); }
    .bill-hero-card.is-overdue { background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05)); border-color: rgba(239,68,68,0.3); }
    .bill-amount { font-size: 48px; font-weight: 800; letter-spacing: -2px; line-height: 1.1; margin: 8px 0; color: var(--color-primary-light); }
    .overdue-text { color: var(--color-danger) !important; }
    
    .early-bird-banner { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; }
    .early-bird-text { font-size: 12px; color: #10B981; font-weight: 600; }
    
    @keyframes pulseDot { 0% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.4; transform: scale(0.8); } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('usageChart') usageChart!: ElementRef<HTMLCanvasElement>;

  user: User | null = null;
  bills: any[] = [];
  intelligence: any = null;
  insights: PredictiveInsights | null = null;
  history: any[] = [];
  loading = true;
  loadingIntel = true;
  paying: string | null = null;
  chart: any;
  private sub = new Subscription();
  
  // Real-time meter ticking
  liveReading: number = 0;
  meterInterval: any;

  constructor(
    private authState: AuthState,
    public billService: BillService,
    private paymentService: PaymentService,
    private showcaseService: ShowcaseService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.authState.user$.subscribe(user => {
      this.user = user;
      this.refreshMeterBase();
    }));
    
    // Watch for showcase mode toggle
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(() => {
      this.refreshMeterBase();
      this.loadDashboard();
    }));
  }

  private refreshMeterBase(): void {
    if (this.showcaseService.isShowcaseActive) {
      this.liveReading = 1450.42; // Seeded mock reading
    } else if (this.user?.lastKnownReading) {
      this.liveReading = this.user.lastKnownReading;
    }
    this.setupLiveMeter();
  }

  setupLiveMeter(): void {
    if (this.meterInterval) clearInterval(this.meterInterval);
    
    const isSmart = this.showcaseService.isShowcaseActive || this.user?.isSmartMeterEnabled;
    if (isSmart) {
      this.meterInterval = setInterval(() => {
        const rate = this.showcaseService.isShowcaseActive ? 1.2 : (this.user?.consumptionRate || 0.2);
        const tickIncrement = (rate / 3600) * 80; // 80x multiplier for visual demo
        this.liveReading += tickIncrement + (Math.random() * 0.0001);
      }, 1000);
    }
  }

  loadDashboard(): void {
    this.loading = true;
    this.loadingIntel = true;

    forkJoin({
      bills: this.billService.listMy({ limit: 3 }),
      intel: this.billService.getIntelligence(),
      insights: this.aiService.getInsights(this.showcaseService.isShowcaseActive)
    }).subscribe({
      next: (res) => {
        this.bills = res.bills.bills || [];
        this.intelligence = res.intel;
        this.insights = res.insights;
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

  get displayUser(): any {
    if (this.showcaseService.isShowcaseActive && this.user?.role === 'CONSUMER') {
      return {
        name: 'Aditya Sharma',
        email: 'aditya.sharma@example.com',
        role: 'CONSUMER (DEMO)',
        consumerId: 'EN-821901',
        address: 'Sector 4, Dwarka, New Delhi'
      };
    }
    return this.user;
  }

  ngOnDestroy(): void {
    if (this.meterInterval) clearInterval(this.meterInterval);
    if (this.chart) this.chart.destroy();
    this.sub.unsubscribe();
  }
}
