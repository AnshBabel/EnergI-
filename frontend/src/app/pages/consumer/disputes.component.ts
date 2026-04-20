import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisputeService } from '../../services/dispute.service';
import { ShowcaseService } from '../../services/showcase.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consumer-disputes',
  standalone: true,
  imports: [CommonModule, AppLayoutComponent],
  templateUrl: './disputes.component.html',
  styles: []
})
export class DisputesComponent implements OnInit, OnDestroy {
  disputes: any[] = [];
  loading = true;
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
    this.disputeService.listMy().subscribe({
      next: (data) => {
        this.disputes = data.disputes || [];
      },
      error: (err) => console.error(err),
      complete: () => {
        this.loading = false;
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

