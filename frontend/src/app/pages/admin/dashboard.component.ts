import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { AuthState, User } from '../../state/auth.state';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { forkJoin } from 'rxjs';
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
  ],
  styles: []
})
export class DashboardComponent implements OnInit {
  @ViewChild('statsChart') statsChart!: ElementRef<HTMLCanvasElement>;
  
  analytics: any = null;
  user: User | null = null;
  history: any[] = [];
  recentBills: any[] = [];
  loading = true;
  chart: any;

  constructor(
    private billService: BillService,
    private authState: AuthState
  ) {}

  ngOnInit(): void {
    this.authState.user$.subscribe(u => this.user = u);
    forkJoin({
      analytics: this.billService.analytics(),
      bills: this.billService.listAll({ limit: 5 }),
      history: this.billService.getHistory()
    }).subscribe({
      next: (res) => {
        this.analytics = res.analytics;
        this.recentBills = res.bills.bills || [];
        this.history = res.history;
        
        // Use a slight timeout to ensure view is ready
        setTimeout(() => this.initChart(), 0);
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  initChart(): void {
    if (!this.statsChart) return;

    const ctx = this.statsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.history.map(h => `${h._id.month}/${h._id.year}`);
    const collectedData = this.history.map(h => h.collected / 100);
    const pendingData = this.history.map(h => h.pending / 100);

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

  formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}

