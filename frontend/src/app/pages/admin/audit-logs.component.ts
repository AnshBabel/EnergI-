import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../services/audit-log.service';
import { ShowcaseService } from '../../services/showcase.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './audit-logs.component.html',
  styles: [`
    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .audit-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1.25rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .audit-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-user { background: rgba(99, 102, 241, 0.15); color: #818CF8; }
    .badge-tariff { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }
    .badge-billing { background: rgba(16, 185, 129, 0.15); color: #34D399; }
    .badge-dispute { background: rgba(239, 68, 68, 0.15); color: #F87171; }
    .badge-payment { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
    .badge-system { background: rgba(107, 114, 128, 0.15); color: #9CA3AF; }
    
    .detail-overlay {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 450px;
      max-width: 100%;
      background: #0f172a;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
      z-index: 50;
      padding: 2rem;
      overflow-y: auto;
    }
    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 40;
    }
    pre {
      background: #020617;
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.8rem;
      color: #94a3b8;
      overflow-x: auto;
    }
  `]
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  logs: any[] = [];
  loading = true;
  error = '';
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 1;
  
  // Filters
  selectedAction = '';
  selectedTargetModel = '';
  
  selectedLog: any = null;
  private sub = new Subscription();

  actionsList = [
    { value: 'USER_CREATED', label: 'User Created' },
    { value: 'USER_UPDATED', label: 'User Updated' },
    { value: 'USER_DEACTIVATED', label: 'User Deactivated' },
    { value: 'TARIFF_CREATED', label: 'Tariff Created' },
    { value: 'TARIFF_ACTIVATED', label: 'Tariff Activated' },
    { value: 'TARIFF_DEACTIVATED', label: 'Tariff Deactivated' },
    { value: 'TARIFF_DELETED', label: 'Tariff Deleted' },
    { value: 'BILL_CREATED', label: 'Bill Created' },
    { value: 'BILL_CYCLE_RUN', label: 'Billing Cycle Run' },
    { value: 'PAYMENT_REFUNDED', label: 'Payment Refunded' },
    { value: 'DISPUTE_CREATED', label: 'Dispute Created' },
    { value: 'DISPUTE_UPDATED', label: 'Dispute Updated' },
    { value: 'DISPUTE_RESOLVED', label: 'Dispute Resolved' }
  ];

  targetModelsList = [
    { value: 'User', label: 'User / Consumer' },
    { value: 'TariffConfig', label: 'Tariff Config' },
    { value: 'Bill', label: 'Bill' },
    { value: 'Payment', label: 'Payment' },
    { value: 'Dispute', label: 'Dispute' }
  ];

  constructor(
    private auditService: AuditLogService,
    private showcaseService: ShowcaseService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(() => {
      this.load();
    }));
  }

  load(): void {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      page: this.page,
      limit: this.limit
    };
    if (this.selectedAction) params.action = this.selectedAction;
    if (this.selectedTargetModel) params.targetModel = this.selectedTargetModel;

    this.auditService.list(params).subscribe({
      next: (res) => {
        this.logs = res.logs || [];
        this.total = res.total || 0;
        this.totalPages = res.totalPages || 1;
      },
      error: (err) => {
        console.error('Failed to load audit logs', err);
        this.error = 'Unable to load audit logs. Please try again.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.selectedAction = '';
    this.selectedTargetModel = '';
    this.page = 1;
    this.load();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  selectLog(log: any): void {
    this.selectedLog = log;
  }

  closeDetails(): void {
    this.selectedLog = null;
  }

  getBadgeClass(action: string): string {
    const act = action.toUpperCase();
    if (act.startsWith('USER')) return 'badge-user';
    if (act.startsWith('TARIFF')) return 'badge-tariff';
    if (act.startsWith('BILL')) return 'badge-billing';
    if (act.startsWith('DISPUTE')) return 'badge-dispute';
    if (act.startsWith('PAYMENT')) return 'badge-payment';
    return 'badge-system';
  }

  formatJson(data: any): string {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
