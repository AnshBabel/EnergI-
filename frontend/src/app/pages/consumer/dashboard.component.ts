import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { PaymentService } from '../../services/payment.service';
import { AuthState, User } from '../../state/auth.state';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { Chart, registerables } from 'chart.js';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { forkJoin } from 'rxjs';

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
  styles: []
})
export class DashboardComponent implements OnInit {
  @ViewChild('usageChart') usageChart!: ElementRef<HTMLCanvasElement>;

  user: User | null = null;
  bills: any[] = [];
  history: any[] = [];
  loading = true;
  paying: string | null = null;
  chart: any;

  constructor(
    private authState: AuthState,
    public billService: BillService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.authState.user$.subscribe(user => this.user = user);
    
    forkJoin({
      bills: this.billService.listMy({ limit: 3 }),
      history: this.billService.getMyHistory()
    }).subscribe({
      next: (res) => {
        this.bills = res.bills.bills || [];
        this.history = res.history;
        setTimeout(() => this.initChart(), 0);
      },
      error: (err) => console.error(err),
      complete: () => this.loading = false
    });
  }

  initChart(): void {
    if (!this.usageChart) return;
    const ctx = this.usageChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.history.map(h => `${h._id.month}/${h._id.year}`);
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
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}
