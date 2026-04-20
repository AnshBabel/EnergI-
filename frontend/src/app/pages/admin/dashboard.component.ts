import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { ShowcaseService } from '../../services/showcase.service';
import { AuthState, User } from '../../state/auth.state';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { forkJoin, Subscription } from 'rxjs'; // Added Subscription for cleanup
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
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
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('statsChart') statsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChart!: ElementRef<HTMLCanvasElement>;
  
  analytics: any = null;
  user: User | null = null;
  history: any[] = [];
  recentBills: any[] = [];
  loading = true;
  processingBatch = false;
  batchResult: any = null;
  chart: any;
  pieChart: any;
  private sub = new Subscription(); // To prevent memory leaks

  constructor(
    private billService: BillService,
    private showcaseService: ShowcaseService,
    private authState: AuthState
  ) {}

  ngOnInit(): void {
    this.sub.add(this.authState.user$.subscribe(u => this.user = u));
    
    // Subscribe to Showcase Mode changes
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(() => {
      this.loadDashboardData();
    }));
  }


  loadDashboardData(): void {
    this.loading = true;
    forkJoin({
      analytics: this.billService.analytics(),
      bills: this.billService.listAll({ limit: 5 }),
      history: this.billService.getHistory()
    }).subscribe({
      next: (res) => {
        this.analytics = res.analytics;
        this.recentBills = res.bills?.bills || [];
        this.history = res.history || [];
        
        // Safety Guard: Only init charts if possible
        setTimeout(() => {
          this.initChart();
          this.initRevenueChart();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  initChart(): void {
    // Permanent Fix 1: Check if canvas exists and history has items
    if (!this.statsChart || !this.history.length) return;

    const ctx = this.statsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists (prevents ghosting/memory leaks)
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.history.map(h => `${h._id.month}/${h._id.year}`);
    const collectedData = this.history.map(h => (h.collected || 0) / 100);
    const pendingData = this.history.map(h => (h.pending || 0) / 100);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Collected (₹)',
            data: collectedData,
            borderColor: '#7C3AED',
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#7C3AED',
            pointBorderColor: '#fff',
            pointHoverRadius: 6
          },
          {
            label: 'Pending (₹)',
            data: pendingData,
            borderColor: '#F59E0B',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 12 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { 
              color: '#64748b',
              callback: (value) => '₹' + value 
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  initRevenueChart(): void {
    if (!this.revenueChart || !this.analytics?.revenueMix) return;
    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.pieChart) this.pieChart.destroy();

    const data = this.analytics.revenueMix.map((m: any) => (m.value || 0) / 100);
    const backgroundColors = this.analytics.revenueMix.map((m: any) => m.color);

    this.pieChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Collections Progress'],
        datasets: this.analytics.revenueMix.map((m: any, i: number) => ({
          label: m.label,
          data: [(m.value || 0) / 100],
          backgroundColor: m.color,
          borderRadius: i === 0 ? { topLeft: 10, bottomLeft: 10 } : i === 2 ? { topRight: 10, bottomRight: 10 } : 0,
          barThickness: 40
        }))
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } },
          tooltip: {
            callbacks: {
              label: (item: any) => `${item.dataset.label}: ₹${item.raw.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: { stacked: true, display: false },
          y: { stacked: true, display: false }
        }
      }
    });
  }

  runBatchCycle(): void {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    
    if (!confirm(`Are you sure you want to trigger the billing cycle for ${month}/${year}? This will generate bills for all active consumers.`)) return;

    this.processingBatch = true;
    this.billService.runCycle(month, year).subscribe({
      next: (res) => {
        this.batchResult = res;
        this.loadDashboardData(); // Refresh stats
      },
      error: (err) => {
        alert(err.error?.error || 'Batch billing failed');
        this.processingBatch = false;
      },
      complete: () => {
        this.processingBatch = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
    this.sub.unsubscribe();
  }

  formatAmount(paise: number): string {
    if (!paise && paise !== 0) return '₹0.00';
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}