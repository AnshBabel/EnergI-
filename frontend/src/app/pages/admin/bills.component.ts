import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';
import { UserService } from '../../services/user.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-admin-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './bills.component.html',
  styles: []
})
export class BillsComponent implements OnInit {
  bills: any[] = [];
  consumers: any[] = [];
  loading = true;
  showModal = false;
  error = '';
  saving = false;
  filterStatus = '';
  cycleResult: any = null;
  
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  form: any = {
    userId: '',
    previousReading: '',
    currentReading: '',
    billingPeriod: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
  };

  constructor(
    public billService: BillService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    Promise.all([
      this.billService.listAll({ status: this.filterStatus }).toPromise(),
      this.userService.list({ limit: 200 }).toPromise()
    ]).then(([billData, userData]) => {
      this.bills = billData.bills || [];
      this.consumers = userData.users || [];
    }).catch(err => {
      console.error('Failed to load bills', err);
    }).finally(() => {
      this.loading = false;
    });
  }

  handleGenerate(e: Event): void {
    e.preventDefault();
    this.error = '';
    this.saving = true;
    this.billService.generate(this.form.userId, {
      previousReading: Number(this.form.previousReading),
      currentReading: Number(this.form.currentReading),
      billingPeriod: this.form.billingPeriod,
    }).subscribe({
      next: () => {
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to generate bill';
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  handleExport(): void {
    this.billService.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `energi-bills-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => alert('Export failed')
    });
  }

  handleRunCycle(): void {
    if (!confirm('Are you sure you want to run the automated billing cycle? This will parse the database and generate bills for unbilled consumers.')) return;
    
    // Defaulting to current month/year for the simulation cycle
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    
    this.billService.runCycle(month, year).subscribe({
      next: (res) => {
        this.cycleResult = res;
        this.load();
      },
      error: (err) => alert(err.error?.error || 'Auto-Billing cycle failed.')
    });
  }

  formatAmount(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}
