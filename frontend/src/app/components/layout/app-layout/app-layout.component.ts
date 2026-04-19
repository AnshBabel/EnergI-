import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthState, User, Org } from '../../../state/auth.state';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ShowcaseService } from '../../../services/showcase.service';


@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.component.html',
  styles: [`
    .sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--color-border); margin-top: auto; }
    .user-chip { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px; }
    .user-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 14px; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; display: flex; align-items: center; gap: 4px; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
    .user-role.admin { color: var(--color-primary-light); }
    .user-role.consumer { color: #10B981; }
    .role-dot { width: 6px; height: 6px; border-radius: 50%; }
    .admin .role-dot { background: var(--color-primary-light); box-shadow: 0 0 8px var(--color-primary-light); }
    .consumer .role-dot { background: #10B981; box-shadow: 0 0 8px #10B981; }
    .logout-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); color: #EF4444; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .logout-btn:hover { background: rgba(239, 68, 68, 0.1); transform: translateY(-1px); }
    .theme-toggle-btn { margin-bottom: 12px; width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-surface-2); color: var(--color-text); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .theme-toggle-btn:hover { background: var(--color-border); transform: translateY(-1px); }
    .showcase-toggle-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05); color: #10B981; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 12px; }
    .showcase-toggle-btn.inactive { border-color: var(--color-border); background: var(--color-surface-2); color: var(--color-text-muted); opacity: 0.6; }
    .showcase-toggle-btn:hover { transform: translateY(-1px); }
    .toggle-switch { width: 32px; height: 18px; border-radius: 99px; background: rgba(0,0,0,0.2); position: relative; transition: all 0.2s; }
    .showcase-toggle-btn:not(.inactive) .toggle-switch { background: #10B981; }
    .toggle-knob { width: 14px; height: 14px; border-radius: 50%; background: white; position: absolute; top: 2px; left: 2px; transition: all 0.2s; }
    .showcase-toggle-btn:not(.inactive) .toggle-knob { left: 16px; }
  `]
})
export class AppLayoutComponent implements OnInit {
  user: User | null = null;
  org: Org | null = null;

  constructor(
    private authState: AuthState,
    private authService: AuthService,
    public themeService: ThemeService,
    public showcaseService: ShowcaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authState.user$.subscribe(user => this.user = user);
    this.authState.org$.subscribe(org => this.org = org);
  }

  handleLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        this.router.navigate(['/login']);
      }
    });
  }
}
