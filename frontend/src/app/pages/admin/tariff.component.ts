import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TariffService } from '../../services/tariff.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-admin-tariff',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './tariff.component.html',
  styles: []
})
export class TariffComponent implements OnInit {
  tariffs: any[] = [];
  loading = true;
  showModal = false;
  error = '';
  saving = false;
  Math = Math;

  form: any = {
    name: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    fixedChargeInPaise: 0,
    taxPercent: 0,
    slabs: [
      { upToUnits: 100, rateInPaise: 500 },
      { upToUnits: null, rateInPaise: 800 }
    ],
  };

  constructor(private tariffService: TariffService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.tariffService.list().subscribe({
      next: (data) => {
        this.tariffs = data.tariffs || [];
      },
      error: (err) => {
        console.error('Failed to load tariffs', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  addSlab(): void {
    this.form.slabs.push({ upToUnits: null, rateInPaise: 0 });
  }

  removeSlab(i: number): void {
    this.form.slabs.splice(i, 1);
  }

  handleCreate(e: Event): void {
    e.preventDefault();
    this.error = '';
    this.saving = true;
    this.tariffService.create(this.form).subscribe({
      next: () => {
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save tariff';
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  handleActivate(id: string): void {
    this.tariffService.activate(id).subscribe({
      next: () => {
        this.load();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to activate');
      }
    });
  }

  formatPaise(p: number): string {
    return `₹${(p / 100).toFixed(2)}`;
  }
}
