import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ShowcaseService } from '../../services/showcase.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  heroAnomalyActive = false;
  detectSectionActive = false;
  showDemoModal = false;
  demoLoading = false;

  private heroTimeout1: any;
  private heroTimeout2: any;
  private observer: IntersectionObserver | null = null;
  
  // Live State
  liveLoad = 14.2;
  activeMeters = 4208;
  aiCopilotState = 0; // 0: Monitoring, 1: Analyzing, 2: Insight, 3: Recommendation, 4: Optimal
  aiStates = [
    "MONITORING GRID...",
    "ANALYZING LOAD PATTERNS...",
    "INSIGHT FOUND\nConsumption at M-204 is 18% above expected baseline.",
    "RECOMMENDATION\nShift load between 18:00–20:00.",
    "OPTIMAL"
  ];
  showAiInsight = false;
  lastSync = this.getTime();
  liveActivity = [
    { time: this.getTime(10), msg: 'Grid status stable' },
    { time: this.getTime(7), msg: 'AI insight generated' },
    { time: this.getTime(4), msg: 'Load pattern analyzed' },
    { time: this.getTime(1), msg: 'Meter M-204 updated' }
  ];

  private intervals: any[] = [];

  @ViewChild('detectSection') detectSection!: ElementRef;

  constructor(
    private authService: AuthService,
    private showcaseService: ShowcaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // AI Detection Timing (Rare and Meaningful)
    // Triggers once after 6 seconds, stays for 6 seconds, then resets.
    this.heroTimeout1 = setTimeout(() => {
      this.heroAnomalyActive = true;
      this.heroTimeout2 = setTimeout(() => {
        this.heroAnomalyActive = false;
      }, 6000);
    }, 6000);

    // Live Load Fluctuation (Every 3 seconds)
    this.intervals.push(setInterval(() => {
      const diff = (Math.random() * 0.3) - 0.15; // -0.15 to +0.15
      this.liveLoad = Math.max(13.8, Math.min(14.6, parseFloat((this.liveLoad + diff).toFixed(1))));
    }, 3000));

    // Active Meters Fluctuation (Every 5 seconds)
    this.intervals.push(setInterval(() => {
      const diff = Math.floor(Math.random() * 3) - 1; // -1 to +1
      this.activeMeters = Math.max(4205, Math.min(4215, this.activeMeters + diff));
    }, 5000));

    // AI Copilot State Machine
    this.intervals.push(setInterval(() => {
      this.aiCopilotState = (this.aiCopilotState + 1) % 5;
      if (this.aiCopilotState === 2) {
        this.addActivity('AI anomaly scan completed');
      } else if (this.aiCopilotState === 4) {
        this.addActivity('Load forecast recalculated');
      }
    }, 4000));

    // Update Last Sync
    this.intervals.push(setInterval(() => {
      this.lastSync = this.getTime();
    }, 1000));

    // Rare AI Insight Event
    this.intervals.push(setInterval(() => {
      this.showAiInsight = true;
      setTimeout(() => this.showAiInsight = false, 8000);
    }, 45000));
    
    // Background Activity Timeline
    this.intervals.push(setInterval(() => {
      const activities = [
        'Meter M-812 updated', 'Tariff sync complete', 'Anomaly check clear', 
        'Telemetry payload received', 'Load pattern analyzed'
      ];
      this.addActivity(activities[Math.floor(Math.random() * activities.length)]);
    }, 8000));
  }

  private getTime(offsetSec = 0): string {
    const d = new Date();
    d.setSeconds(d.getSeconds() - offsetSec);
    return d.toTimeString().split(' ')[0];
  }

  private addActivity(msg: string) {
    this.liveActivity.unshift({ time: this.getTime(), msg });
    if (this.liveActivity.length > 4) {
      this.liveActivity.pop();
    }
  }

  ngAfterViewInit(): void {
    // Intersection Observer for scroll storytelling (Detect Section)
    if (this.detectSection && typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.detectSectionActive = true;
            this.observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      this.observer.observe(this.detectSection.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.heroTimeout1) clearTimeout(this.heroTimeout1);
    if (this.heroTimeout2) clearTimeout(this.heroTimeout2);
    if (this.observer) this.observer.disconnect();
    this.intervals.forEach(i => clearInterval(i));
  }

  openDemoModal(): void {
    this.showDemoModal = true;
  }

  closeDemoModal(): void {
    this.showDemoModal = false;
  }

  activateShowcaseAndRoute(route: string): void {
    if (!this.showcaseService.isShowcaseActive) {
      this.showcaseService.toggleShowcaseMode();
    }
    this.router.navigate([route]);
  }

  loginConsumerDemo(): void {
    this.demoLoading = true;
    this.authService.login({ email: 'consumer@gmail.com', password: 'consumer12345', orgSlug: 'lpu-slug' })
      .subscribe({
        next: () => {
          this.activateShowcaseAndRoute('/consumer/dashboard');
          this.closeDemoModal();
        },
        error: (err) => {
          console.error('Consumer demo login failed', err);
          this.demoLoading = false;
        },
        complete: () => {
          this.demoLoading = false;
        }
      });
  }

  loginAdminDemo(): void {
    this.demoLoading = true;
    this.authService.login({ email: 'admin@gmail.com', password: 'admin12345', orgSlug: 'lpu-slug' })
      .subscribe({
        next: () => {
          this.activateShowcaseAndRoute('/admin/dashboard');
          this.closeDemoModal();
        },
        error: (err) => {
          console.error('Operator demo login failed', err);
          this.demoLoading = false;
        },
        complete: () => {
          this.demoLoading = false;
        }
      });
  }
}
