import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';
import { PaymentService } from '../../services/payment.service';
import { DisputeService } from '../../services/dispute.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-consumer-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './bills.component.html',
  styles: []
})
export class BillsComponent implements OnInit {
  bills: any[] = [];
  loading = true;
  paying: string | null = null;
  disputeModal: any = null;
  disputeReason: string = '';
  disputeSaving = false;

  constructor(
    public billService: BillService,
    private paymentService: PaymentService,
    private disputeService: DisputeService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.billService.listMy().subscribe({
      next: (data) => {
        this.bills = data.bills || [];
      },
      error: (err) => console.error(err),
      complete: () => {
        this.loading = false;
      }
    });
  }

  handlePay(billId: string): void {
    this.paying = billId;
    this.paymentService.checkout(billId).subscribe({
      next: (data) => {
        window.location.href = data.url;
      },
      error: (err) => {
        alert(err.error?.error || 'Payment failed');
        this.paying = null;
      }
    });
  }

  handleDispute(e: Event): void {
    e.preventDefault();
    this.disputeSaving = true;
    this.disputeService.raise(this.disputeModal._id, this.disputeReason).subscribe({
      next: () => {
        this.disputeModal = null;
        this.disputeReason = '';
        this.load();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to raise dispute');
      },
      complete: () => {
        this.disputeSaving = false;
      }
    });
  }

  formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}
