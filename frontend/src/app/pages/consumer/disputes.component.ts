import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisputeService } from '../../services/dispute.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-consumer-disputes',
  standalone: true,
  imports: [CommonModule, AppLayoutComponent],
  templateUrl: './disputes.component.html',
  styles: []
})
export class DisputesComponent implements OnInit {
  disputes: any[] = [];
  loading = true;

  constructor(private disputeService: DisputeService) {}

  ngOnInit(): void {
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
}
