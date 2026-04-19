import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-iot-hub',
  standalone: true,
  imports: [CommonModule, AppLayoutComponent],
  template: `
    <app-app-layout>
      <div class="page-header" [@fadeInUp]>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 32px;">📡</span>
          <div>
            <h1>IoT Live Hub</h1>
            <p>Real-time monitoring of all smart-meter-enabled consumers.</p>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex-center" style="height: 400px; flex-direction: column; gap: 1rem;">
        <div class="spinner"></div>
        <p class="text-muted">Connecting to your smart-grid...</p>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngIf="meters.length === 0" class="empty-state">
          <div class="icon">🔍</div>
          <h3>No Smart Meters Active</h3>
          <p>Enable Smart Metering for consumers in the Consumers section to see them here.</p>
        </div>

        <div class="grid col-3 gap-6" [@staggerList] *ngIf="meters.length > 0">
          <div *ngFor="let m of meters" class="card stagger-item live-meter-card">
            <div class="flex-between mb-4">
              <div class="badge badge-success" style="font-size: 10px; padding: 2px 8px;">
                <span class="pulse-glow" style="display:inline-block; width: 6px; height: 6px; border-radius: 50%; background: white; margin-right: 4px;"></span>
                ONLINE
              </div>
              <span class="text-muted text-xs">ID: {{ m.consumerId }}</span>
            </div>
            
            <h4 style="margin: 0; font-weight: 700;">{{ m.name }}</h4>
            <div class="text-muted text-xs mb-4">{{ m.meterNumber || 'Meter #—' }}</div>

            <div class="meter-display">
              <div class="digit-box" *ngFor="let d of getDigits(m.lastKnownReading)">{{ d }}</div>
              <span style="color: var(--color-primary-light); font-weight: 700; margin-left: 4px;">kWh</span>
            </div>

            <div class="mt-4 pt-4" style="border-top: 1px solid var(--color-border);">
              <div class="flex-between">
                <span class="text-muted text-xs">Load</span>
                <span style="color: var(--color-success); font-weight: 700; font-size: 12px;">{{ m.consumptionRate }} kW</span>
              </div>
              <div class="load-bar mt-2">
                <div class="load-progress" [style.width]="(m.consumptionRate * 20) + '%'"></div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </app-app-layout>
  `,
  styles: [`
    .live-meter-card { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid var(--color-border); }
    .live-meter-card:hover { transform: translateY(-5px); border-color: var(--color-primary-light); box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1); }
    .meter-display { background: #000; padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
    .digit-box { width: 24px; height: 32px; background: #1a1a1a; color: #00FF41; display: flex; align-items: center; justify-content: center; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 700; border-radius: 4px; border-bottom: 2px solid #00c832; }
    .load-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
    .load-progress { height: 100%; background: var(--color-success); box-shadow: 0 0 10px var(--color-success); border-radius: 2px; }
    .pulse-glow { animation: pulse-glow 2s infinite; }
  `],
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
export class IotHubComponent implements OnInit, OnDestroy {
  meters: any[] = [];
  loading = true;
  private sub = new Subscription();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadMeters();
    // Poll for updates every 5 seconds
    this.sub.add(interval(5000).subscribe(() => this.loadMeters(false)));
  }

  loadMeters(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.userService.list().subscribe({
      next: (res) => {
        // Filter only smart-meter users
        this.meters = (res.users || []).filter((u: any) => u.isSmartMeterEnabled);
      },
      error: (err) => console.error(err),
      complete: () => {
        this.loading = false;
      }
    });
  }

  getDigits(value: number): string[] {
    const str = Math.floor(value || 0).toString().padStart(6, '0');
    return str.split('');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
