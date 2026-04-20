import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisputeService } from '../../services/dispute.service';
import { ShowcaseService } from '../../services/showcase.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './disputes.component.html',
  styles: []
})
export class DisputesComponent implements OnInit, OnDestroy {
  disputes: any[] = [];
  loading = true;
  selected: any = null;
  resolveForm = { resolution: 'RESOLVED', adminNote: '' };
  saving = false;
  private sub = new Subscription();

  constructor(
    private disputeService: DisputeService,
    private showcaseService: ShowcaseService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.showcaseService.showcaseMode$.subscribe(() => {
      this.load();
    }));
  }

  load(): void {
    this.loading = true;
    this.disputeService.listAll().subscribe({
      next: (data) => {
        this.disputes = data.disputes || [];
      },
      error: (err) => {
        console.error('Failed to load disputes', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  handleResolve(e: Event): void {
    e.preventDefault();
    this.saving = true;
    this.disputeService.resolve(this.selected._id, this.resolveForm).subscribe({
      next: () => {
        this.selected = null;
        this.resolveForm = { resolution: 'RESOLVED', adminNote: '' };
        this.load();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to resolve dispute');
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  handleSetUnderReview(id: string): void {
    this.disputeService.updateStatus(id, 'UNDER_REVIEW').subscribe({
      next: () => {
        this.load();
      },
      error: () => {
        alert('Failed to update status');
      }
    });
  }

  formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}

