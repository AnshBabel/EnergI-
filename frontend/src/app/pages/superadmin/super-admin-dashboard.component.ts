import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../services/superadmin.service';
import { AuthService } from '../../services/auth.service';
import { AuthState } from '../../state/auth.state';
import { HttpClient } from '@angular/common/http';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  template: `
    <app-app-layout>
      <!-- Master Telemetry Drill-down Modal -->
      <div *ngIf="activeDrilldown" class="modal-overlay animate-in" style="z-index: 99999;">
        <div class="online-users-modal">
          <div class="modal-header-flex">
            <h3 class="modal-title">{{ drilldownTitle }}</h3>
            <button class="close-modal-btn" (click)="activeDrilldown = null">×</button>
          </div>
          <p class="modal-subtitle">{{ drilldownSubtitle }}</p>
          
          <div class="online-users-list">
            <!-- View: Online Members -->
            <ng-container *ngIf="activeDrilldown === 'online'">
              <div *ngFor="let user of metrics?.onlineUsersList" class="online-user-item">
                <div class="user-avatar-small" [class.admin]="user.role === 'ADMIN'" [class.super]="user.role === 'SUPER_ADMIN'">
                  {{ user.name[0] }}
                </div>
                <div class="user-details-mini">
                  <div class="u-name">{{ user.name }}</div>
                  <div class="u-meta">{{ user.organization }} • <span class="role-tag">{{ user.role }}</span></div>
                </div>
                <div class="online-pulse-tag"><span class="dot"></span> LIVE</div>
              </div>
              <div *ngIf="!metrics?.onlineUsersList?.length" class="empty-online">No active sessions detected.</div>
            </ng-container>

            <!-- View: Organizations -->
            <ng-container *ngIf="activeDrilldown === 'orgs'">
              <div *ngFor="let org of metrics?.activeOrganizationsList" class="online-user-item">
                <div class="user-avatar-small admin">🏢</div>
                <div class="user-details-mini">
                  <div class="u-name">{{ org.name }}</div>
                  <div class="u-meta">Slug: <strong>{{ org.slug }}</strong> • <span class="role-tag">{{ org.manager }}</span></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                  <div class="online-pulse-tag"><span class="dot"></span> {{ org.meterCount }} METERS</div>
                  <div class="online-pulse-tag" style="background: rgba(124, 58, 237, 0.1); color: #a78bfa;" *ngIf="org.onlineCount > 0">
                    <span class="dot" style="background: #a78bfa;"></span> {{ org.onlineCount }} ONLINE
                  </div>
                </div>
              </div>
              <div *ngIf="!metrics?.activeOrganizationsList?.length" class="empty-online">No active organizations found.</div>
            </ng-container>

            <!-- View: Meters -->
            <ng-container *ngIf="activeDrilldown === 'meters'">
              <div *ngFor="let meter of metrics?.connectedMetersList" class="online-user-item">
                <div class="user-avatar-small super">⚡</div>
                <div class="user-details-mini">
                  <div class="u-name">{{ meter.name }}</div>
                  <div class="u-meta">{{ meter.organization }} • ID: <strong>{{ meter.consumerId }}</strong></div>
                </div>
                <div class="online-pulse-tag"><span class="dot"></span> {{ meter.meterNumber }}</div>
              </div>
              <div *ngIf="!metrics?.connectedMetersList?.length" class="empty-online">No active meters connected.</div>
            </ng-container>
          </div>

          <div class="modal-footer-alt">
            <button class="btn btn-secondary" (click)="activeDrilldown = null">Close Monitor</button>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content -->
      <div class="premium-header-banner mb-6 animate-in">
        <div class="banner-content">
          <div class="live-pill">
            <span class="pulsing-dot"></span> System Online
          </div>
          <h1 class="header-title">EnergI Enterprise Command 👑</h1>
          <p class="header-subtitle">Full-stack multi-tenant grid directory oversight, telemetry, and God-Mode control.</p>
        </div>

        <div class="header-actions">
          <div class="maintenance-control" [class.active]="metrics?.maintenanceMode">
            <div class="m-label">
              <span class="m-status-dot"></span>
              {{ metrics?.maintenanceMode ? 'PLATFORM FROZEN' : 'PLATFORM LIVE' }}
            </div>
            <button class="m-toggle-btn" (click)="toggleMaintenance(!metrics?.maintenanceMode)">
              {{ metrics?.maintenanceMode ? 'End Maintenance' : 'Start Maintenance' }}
            </button>
          </div>
        </div>

        <div class="banner-glow"></div>
      </div>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <!-- Pinterest-Tier Global Stats Grid -->
      <div class="stats-grid mb-6 animate-in">
        <div class="stat-card premium-stat card-purple clickable-stat" (click)="openOrgsModal()">
          <div class="stat-top">
            <span class="stat-label">Active Organizations</span>
            <span class="stat-icon-bg">🏢</span>
          </div>
          <div class="stat-value">{{ metrics?.totalOrganizations || 0 }}</div>
          <div class="stat-footer">
            <span class="trend up">● 100% Onboarded</span>
            <span class="text-xs text-muted">Utility Clients</span>
          </div>
          <div class="hover-tip">Click to view organizations</div>
        </div>

        <div class="stat-card premium-stat card-emerald clickable-stat" (click)="openMetersModal()">
          <div class="stat-top">
            <span class="stat-label">Connected Meters</span>
            <span class="stat-icon-bg">⚡</span>
          </div>
          <div class="stat-value">{{ metrics?.totalConsumers || 0 }}</div>
          <div class="stat-footer">
            <span class="trend up">● Active Feeds</span>
            <span class="text-xs text-muted">IoT Feeds Streamed</span>
          </div>
          <div class="hover-tip">Click to view smart meters</div>
        </div>

        <div class="stat-card premium-stat card-cyan clickable-stat" (click)="openOnlineModal()">
          <div class="stat-top">
            <span class="stat-label">Live Online Members</span>
            <span class="stat-icon-bg">👥</span>
          </div>
          <div class="stat-value">
            {{ metrics?.onlineUsers || 0 }}
            <span class="unit">Active Now</span>
          </div>
          <div class="stat-footer">
            <span class="trend up">● Real-time Activity</span>
            <span class="text-xs text-muted">Last 5 Minutes</span>
          </div>
          <div class="hover-tip">Click to view active users</div>
        </div>

        <div class="stat-card premium-stat card-amber">
          <div class="stat-top">
            <span class="stat-label">Server Memory Health</span>
            <span class="stat-icon-bg">🧠</span>
          </div>
          <div class="stat-value">
            {{ metrics?.serverMemoryMB || '0.00' }}
            <span class="unit">MB</span>
          </div>
          <div class="stat-footer">
            <span class="trend" [ngClass]="metrics?.memoryStatus === 'STABLE' ? 'up' : 'danger'">
              ● {{ metrics?.memoryStatus || 'STABLE' }}
            </span>
            <span class="text-xs text-muted">Express V8 Heap</span>
          </div>
        </div>

        <div class="stat-card premium-stat card-purple">
          <div class="stat-top">
            <span class="stat-label">Gemini AI Token Pacing</span>
            <span class="stat-icon-bg">✨</span>
          </div>
          <div class="stat-value">{{ metrics?.aiMetrics?.totalHistoricalTokens | number }}</div>
          <div class="stat-footer">
            <span class="trend up">● Real Token Pacing</span>
            <span class="text-xs text-muted">LLM Lifetime Usage</span>
          </div>
        </div>
      </div>

      <!-- 🧠 Google Gemini Telemetry Module -->
      <div class="card mb-6 gemini-telemetry-card animate-in">
        <div class="card-header-flex mb-4">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="icon-box gemini-icon">🧠</div>
            <div>
              <h3 class="card-title">Google Gemini AI Quota Telemetry</h3>
              <p class="card-subtitle">Live tracking of Tokens Per Minute (TPM) and Requests Per Minute (RPM) limits for Gemini 2.5 Flash.</p>
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; align-items: center;">
            <div *ngIf="metrics?.aiMetrics?.lastInteractionTokens > 0" class="last-burn-badge animate-in">
              ⚡ Last Prompt: <strong>{{ metrics?.aiMetrics?.lastInteractionTokens }}</strong> tokens
            </div>
            <div class="refresh-countdown">
              <span class="pulse-ring"></span>
              Resetting in <strong>{{ localRefreshSeconds }}s</strong>
            </div>
          </div>
        </div>

        <div class="telemetry-grid">
          <div class="telemetry-box">
            <div class="t-meta">
              <span class="t-label">Tokens Per Minute (TPM)</span>
              <span class="t-fraction">{{ metrics?.aiMetrics?.currentMinuteTokens | number }} / <span class="text-muted" style="font-size: 14px">{{ metrics?.aiMetrics?.tpmLimit | number }}</span></span>
            </div>
            <div class="t-progress"><div class="progress-bar gemini-bar" [style.width.%]="(metrics?.aiMetrics?.currentMinuteTokens / metrics?.aiMetrics?.tpmLimit) * 100 || 0"></div></div>
            <span class="t-remaining">{{ metrics?.aiMetrics?.remainingMinuteTokens | number }} tokens remaining this minute</span>
          </div>

          <div class="telemetry-box">
            <div class="t-meta">
              <span class="t-label">Requests Per Minute (RPM)</span>
              <span class="t-fraction">{{ metrics?.aiMetrics?.currentMinuteRequests }} / <span class="text-muted" style="font-size: 14px">{{ metrics?.aiMetrics?.rpmLimit }}</span></span>
            </div>
            <div class="t-progress"><div class="progress-bar gemini-bar" [style.width.%]="(metrics?.aiMetrics?.currentMinuteRequests / metrics?.aiMetrics?.rpmLimit) * 100 || 0"></div></div>
            <span class="t-remaining">{{ metrics?.aiMetrics?.remainingMinuteRequests }} API calls remaining this minute</span>
          </div>

          <div class="telemetry-box">
            <div class="t-meta">
              <span class="t-label">Requests Per Day (RPD)</span>
              <span class="t-fraction">{{ metrics?.aiMetrics?.currentDayRequests | number }} / <span class="text-muted" style="font-size: 14px">{{ metrics?.aiMetrics?.rpdLimit | number }}</span></span>
            </div>
            <div class="t-progress"><div class="progress-bar gemini-bar" [style.width.%]="(metrics?.aiMetrics?.currentDayRequests / metrics?.aiMetrics?.rpdLimit) * 100 || 0"></div></div>
            <span class="t-remaining">{{ metrics?.aiMetrics?.rpdLimit - metrics?.aiMetrics?.currentDayRequests | number }} daily API calls remaining</span>
          </div>
        </div>
      </div>

      <!-- Enterprise Tenant Directory -->
      <div class="card directory-card animate-in">
        <div class="flex-between mb-4">
          <h3 class="card-title">🏢 Enterprise Tenant Directory</h3>
          <span class="badge tier-badge">
            {{ orgs.length }} Onboarded Clients
          </span>
        </div>

        <div class="table-wrapper premium-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Organization / Client</th>
                <th>Slug</th>
                <th>Plan Tier</th>
                <th>Connected Meters</th>
                <th>Society Manager</th>
                <th>Grid Status</th>
                <th>Enterprise Control</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let org of orgs" [class.frozen-row]="!org.isActive">
                <td>
                  <div class="org-cell-info">
                    <img *ngIf="org.logoUrl" [src]="org.logoUrl" class="tenant-table-logo">
                    <span class="tenant-name">{{ org.name }}</span>
                  </div>
                </td>
                <td><code class="slug-tag">{{ org.slug }}</code></td>
                <td>
                  <span class="badge plan-badge">
                    {{ org.planTier || 'ENTERPRISE' }}
                  </span>
                </td>
                <td><strong class="meter-count">{{ org.consumerCount }}</strong> smart meters</td>
                <td>
                  <div class="manager-details">
                    <span class="manager-name">{{ org.adminName }}</span>
                    <span class="manager-email">{{ org.adminEmail }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge status-badge" [class.active]="org.isActive">
                    {{ org.isActive ? '● Grid Active' : '○ Grid Frozen' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons-flex">
                    <button class="btn btn-sm btn-freeze-toggle" [class.frozen]="!org.isActive" (click)="openConfirmModal(org)">
                      {{ org.isActive ? 'Freeze Access' : 'Unfreeze Access' }}
                    </button>
                    <button *ngIf="org.adminUserId" class="btn btn-sm btn-god-mode" (click)="impersonate(org.adminUserId, org.adminName)">
                      ⚡ Impersonate Admin
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="orgs.length === 0">
                <td colspan="7" class="empty-state-row">No client utility societies onboarded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Humanized Confirmation Modal for Freeze / Unfreeze -->
      <div *ngIf="confirmingOrg" class="modal-overlay animate-in">
        <div class="confirm-modal-box">
          <div class="confirm-icon-pulse" [class.unfreeze]="!confirmingActive">
            {{ confirmingActive ? '⚠️' : '⚡' }}
          </div>
          <h3 class="confirm-title">{{ confirmingActive ? 'Freeze Client Access?' : 'Unfreeze Client Access?' }}</h3>
          <p class="confirm-desc">
            Are you sure you want to {{ confirmingActive ? 'freeze' : 'unfreeze' }} administrative and smart meter access for <strong>{{ confirmingOrgName }}</strong>?
            <span *ngIf="confirmingActive" class="freeze-warning">
              All connected consumer smart meters and administrative dashboards will be immediately suspended.
            </span>
          </p>
          <div class="modal-buttons-grid">
            <button class="btn btn-secondary cancel-btn" (click)="confirmingOrg = null">Cancel</button>
            <button class="btn btn-primary confirm-btn" [class.unfreeze]="!confirmingActive" (click)="executeToggle()">
              {{ confirmingActive ? 'Yes, Freeze Grid' : 'Yes, Unfreeze Grid' }}
            </button>
          </div>
        </div>
      </div>
    </app-app-layout>
  `,
  styles: [`
    /* Pinterest-Tier Banner */
    .premium-header-banner {
      position: relative;
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(167, 139, 250, 0.05));
      border: 1px solid rgba(124, 58, 237, 0.25);
      border-radius: 24px;
      padding: 36px 40px;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(0,0,0,0.3);
    }
    .live-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
      padding: 6px 14px; border-radius: 99px; margin-bottom: 16px;
    }
    .pulsing-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulseDot 1.5s infinite; }
    @keyframes pulseDot { 0% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.4; transform: scale(0.8); } }
    .header-title { font-size: 32px; font-weight: 800; color: var(--color-text); letter-spacing: -1px; margin: 0 0 6px 0; }
    .header-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; max-width: 600px; line-height: 1.5; }
    .banner-glow { position: absolute; right: -50px; top: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%); filter: blur(30px); pointer-events: none; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }

    /* Pinterest-Tier Stats Grid */
    .premium-stat {
      display: flex; flex-direction: column; justify-content: space-between;
      border-radius: 20px; padding: 24px; border: 1px solid var(--color-border);
      background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(16px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .premium-stat:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.4); }
    .premium-stat.card-purple:hover { border-color: rgba(124, 58, 237, 0.5); }
    .premium-stat.card-emerald:hover { border-color: rgba(16, 185, 129, 0.5); }
    .premium-stat.card-cyan:hover { border-color: rgba(6, 182, 212, 0.5); }
    .premium-stat.card-amber:hover { border-color: rgba(245, 158, 11, 0.5); }
    .stat-top { display: flex; justify-content: space-between; align-items: center; }
    .stat-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-icon-bg { font-size: 20px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); }
    .stat-value { font-size: 32px; font-weight: 800; color: var(--color-text); margin: 12px 0; letter-spacing: -1px; }
    .stat-value .unit { font-size: 16px; font-weight: 600; color: var(--color-text-muted); }
    .stat-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; margin-top: 8px; }
    .trend { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
    .trend.up { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .trend.neutral { background: rgba(6, 182, 212, 0.15); color: #67e8f9; }
    .trend.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    /* Clickable Stat */
    .clickable-stat { cursor: pointer; position: relative; }
    .clickable-stat:hover { border-color: var(--color-primary-light); background: rgba(26, 26, 46, 0.8); }
    .hover-tip { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--color-primary-light); opacity: 0; transition: 0.3s; pointer-events: none; }
    .clickable-stat:hover .hover-tip { opacity: 1; bottom: 8px; }

    /* Modal Overlay & Standard styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }

    /* Online Modal Specifics */
    .online-users-modal { width: 480px; background: #1a1a2e; border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 28px; padding: 32px; box-shadow: 0 30px 70px rgba(0,0,0,0.7); }
    .modal-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .modal-title { font-size: 22px; font-weight: 800; color: white; margin: 0; }
    .modal-subtitle { font-size: 13px; color: var(--color-text-muted); margin-bottom: 24px; }
    .close-modal-btn { background: none; border: none; color: var(--color-text-muted); font-size: 28px; cursor: pointer; line-height: 1; }
    .close-modal-btn:hover { color: white; }
    
    .online-users-list { max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 8px; }
    .online-user-item { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .user-avatar-small { width: 32px; height: 32px; border-radius: 8px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
    .user-avatar-small.admin { background: #7c3aed; }
    .user-avatar-small.super { background: #ef4444; }
    .user-details-mini { flex: 1; }
    .u-name { font-weight: 700; color: white; font-size: 14px; }
    .u-meta { font-size: 12px; color: var(--color-text-muted); }
    .role-tag { color: var(--color-primary-light); font-weight: 600; text-transform: uppercase; font-size: 10px; }
    .online-pulse-tag { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 8px; }
    .online-pulse-tag .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: pulseDot 1.5s infinite; }
    .empty-online { text-align: center; padding: 40px; color: var(--color-text-muted); font-style: italic; }
    .modal-footer-alt { margin-top: 24px; display: flex; justify-content: flex-end; }

    /* Maintenance Control */
    .header-actions { display: flex; align-items: center; gap: 20px; z-index: 5; }
    .maintenance-control { 
      background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); 
      padding: 8px 16px; border-radius: 16px; display: flex; align-items: center; gap: 16px;
      backdrop-filter: blur(10px); transition: 0.3s;
    }
    .maintenance-control.active { border-color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
    .m-label { font-size: 11px; font-weight: 800; color: #94a3b8; display: flex; align-items: center; gap: 6px; letter-spacing: 1px; }
    .maintenance-control.active .m-label { color: #ef4444; }
    .m-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
    .maintenance-control.active .m-status-dot { background: #ef4444; box-shadow: 0 0 12px #ef4444; animation: pulseDot 1s infinite; }
    .m-toggle-btn { 
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
      color: white; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 700;
      cursor: pointer; transition: 0.2s;
    }
    .m-toggle-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .maintenance-control.active .m-toggle-btn { background: #ef4444; border-color: #ef4444; color: white; }
    .maintenance-control.active .m-toggle-btn:hover { background: #dc2626; }

    /* Card Header Flex */
    .card-header-flex { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .icon-box { width: 48px; height: 48px; font-size: 24px; display: flex; align-items: center; justify-content: center; border-radius: 14px; }
    .icon-box.db-icon { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }
    .card-title { font-size: 20px; font-weight: 700; color: var(--color-text); margin: 0 0 4px 0; }
    .card-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 0; }
    .cloud-actions-flex { display: flex; gap: 12px; }
    .btn-cloud-action { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-cloud-action:hover { background: #10b981; color: white; transform: translateY(-1px); }

    /* Mongoose DB Card */
    .db-shard-card { background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.02)); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 24px; }
    .db-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .db-metric-box { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; }
    .db-metric-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
    .db-metric-val { font-size: 24px; font-weight: 700; color: var(--color-text); margin: 8px 0; }
    .db-metric-val .unit { font-size: 14px; color: var(--color-text-muted); }
    .db-progress { width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; margin-top: 4px; }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 99px; }

    /* Dynamic Collections Table */
    .col-name-tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 6px 10px; border-radius: 8px; font-size: 13px; color: white; font-weight: 600; }
    .count-badge { background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }

    /* Gemini Telemetry Module */
    .gemini-telemetry-card { background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(217, 119, 6, 0.02)); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 24px; padding: 28px; }
    .gemini-icon { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }
    .last-burn-badge { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--color-success); padding: 8px 16px; border-radius: 99px; font-size: 12px; font-weight: 700; }
    .refresh-countdown { display: flex; align-items: center; gap: 8px; background: var(--color-surface-2); padding: 8px 16px; border-radius: 99px; font-size: 13px; color: var(--color-warning); font-weight: 600; border: 1px solid var(--color-border); }
    .pulse-ring { width: 8px; height: 8px; background: var(--color-warning); border-radius: 50%; box-shadow: 0 0 10px var(--color-warning); animation: pulseDot 1.5s infinite; }
    .telemetry-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    .telemetry-box { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 16px; padding: 20px; }
    .t-meta { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
    .t-label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .t-fraction { font-size: 18px; font-weight: 800; color: var(--color-text); }
    .t-progress { width: 100%; height: 6px; background: var(--color-border); border-radius: 99px; overflow: hidden; margin-bottom: 8px; }
    .gemini-bar { background: linear-gradient(90deg, #f59e0b, #fbbf24); transition: width 0.3s ease; }
    .t-remaining { font-size: 11px; color: var(--color-warning); font-weight: 600; }

    /* Directory Card */
    .tier-badge { background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-weight: 700; padding: 6px 14px; border-radius: 12px; font-size: 12px; }
    .premium-table-wrapper { border-radius: 20px; overflow: hidden; border: 1px solid var(--color-border); background: var(--color-surface); }
    .org-cell-info { display: flex; align-items: center; gap: 14px; }
    .tenant-table-logo { width: 36px; height: 36px; border-radius: 10px; object-fit: contain; background: white; border: 1px solid var(--color-border); }
    .tenant-name { font-weight: 700; color: var(--color-text); font-size: 15px; }
    .slug-tag { background: var(--color-surface-2); padding: 6px 10px; border-radius: 8px; font-size: 12px; color: var(--color-primary-light); font-weight: 600; }
    .plan-badge { background: rgba(167, 139, 250, 0.15); color: #c084fc; font-weight: 700; text-transform: uppercase; font-size: 11px; padding: 6px 12px; border-radius: 8px; }
    .meter-count { color: var(--color-text); font-weight: 700; }
    .manager-details { display: flex; flex-direction: column; gap: 2px; }
    .manager-name { font-weight: 600; color: var(--color-text); }
    .manager-email { font-size: 12px; color: var(--color-text-muted); }
    .status-badge { padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; background: rgba(239, 68, 68, 0.1); color: var(--color-danger); }
    .status-badge.active { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
    .action-buttons-flex { display: flex; gap: 12px; }
    .btn-freeze-toggle { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-freeze-toggle.frozen { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .btn-freeze-toggle:hover { background: #ef4444; color: white; }
    .btn-freeze-toggle.frozen:hover { background: #10b981; color: white; }
    .btn-god-mode { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-god-mode:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4); }
    .frozen-row { background: rgba(239, 68, 68, 0.05); }
    .empty-state-row { text-align: center; padding: 48px 0; color: var(--color-text-muted); font-size: 14px; }

    /* Modal Overlay */
    .confirm-modal-box { width: 440px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 24px; padding: 36px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); text-align: center; }
    .confirm-icon-pulse { width: 72px; height: 72px; background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
    .confirm-icon-pulse.unfreeze { background: rgba(16, 185, 129, 0.2); color: #10b981; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
    .confirm-title { margin: 0 0 12px 0; font-size: 24px; color: var(--color-text); font-weight: 800; }
    .confirm-desc { font-size: 14px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 32px; }
    .freeze-warning { display: block; margin-top: 10px; color: var(--color-danger); font-weight: 600; }
    .modal-buttons-grid { display: flex; gap: 16px; }
    .cancel-btn { flex: 1; padding: 14px; border-radius: 14px; font-weight: 600; }
    .confirm-btn { flex: 1; padding: 14px; border-radius: 14px; font-weight: 700; background: #ef4444; border: none; }
    .confirm-btn.unfreeze { background: #10b981; }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  metrics: any = null;
  orgs: any[] = [];
  error = '';
  success = '';

  localRefreshSeconds = 0;
  refreshInterval: any;

  // Confirmation Modal State
  confirmingOrg: string | null = null;
  confirmingOrgName = '';
  confirmingActive = true;

  // Drilldown State
  activeDrilldown: 'online' | 'orgs' | 'meters' | null = null;

  get drilldownTitle(): string {
    switch (this.activeDrilldown) {
      case 'online': return 'Live Telemetry: Online Members';
      case 'orgs': return 'Enterprise Directory';
      case 'meters': return 'Grid Telemetry: Connected Meters';
      default: return '';
    }
  }

  get drilldownSubtitle(): string {
    switch (this.activeDrilldown) {
      case 'online': return 'Real-time session detection for the last 5 minutes.';
      case 'orgs': return 'Currently active utility and society partners.';
      case 'meters': return 'Real-time IoT smart meter feeds.';
      default: return '';
    }
  }

  constructor(
    private superAdminService: SuperAdminService,
    private authService: AuthService,
    private authState: AuthState,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadData(): void {
    this.superAdminService.getOverview().subscribe({
      next: (res) => {
        this.metrics = res.metrics;
        if (this.metrics?.aiMetrics?.secondsToRefresh !== undefined) {
          this.localRefreshSeconds = this.metrics.aiMetrics.secondsToRefresh;
          this.startRefreshCountdown();
        }
      },
      error: () => this.error = 'Failed to load telemetry HUD metrics.'
    });

    this.superAdminService.getOrganizations().subscribe({
      next: (res) => this.orgs = res.organizations,
      error: () => this.error = 'Failed to load enterprise tenant directory.'
    });
  }

  startRefreshCountdown(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (this.localRefreshSeconds > 0) {
        this.localRefreshSeconds--;
      } else {
        this.loadData(); // Poll backend when it hits 0
      }
    }, 1000);
  }

  triggerCloudAction(actionName: string): void {
    this.success = `🚀 MongoDB Atlas Cloud command '${actionName}' executed across Cluster0 (EnergI_DB) successfully.`;
    setTimeout(() => this.success = '', 5000);
  }

  openConfirmModal(org: any): void {
    this.confirmingOrg = org._id;
    this.confirmingOrgName = org.name;
    this.confirmingActive = org.isActive;
  }

  executeToggle(): void {
    if (!this.confirmingOrg) return;
    this.error = ''; this.success = '';
    const targetId = this.confirmingOrg;
    this.confirmingOrg = null;

    this.superAdminService.toggleOrganization(targetId).subscribe({
      next: (res) => {
        this.success = res.message;
        this.loadData();
      },
      error: () => this.error = 'Failed to toggle client access status.'
    });
  }

  impersonate(adminUserId: string, adminName: string): void {
    this.error = ''; this.success = '';
    this.superAdminService.impersonate(adminUserId).subscribe({
      next: (res) => {
        localStorage.setItem('accessToken', res.accessToken);
        this.authState.setUser(res.user);
        this.authState.setOrg(res.org);
        console.log(`⚡ IMPERSONATION ENGAGED: ${adminName}`);
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => this.error = 'Failed to engage God-Mode impersonation sequence.'
    });
  }
  openOrgsModal(): void {
    this.activeDrilldown = 'orgs';
  }

  openMetersModal(): void {
    this.activeDrilldown = 'meters';
  }

  openOnlineModal(): void {
    this.activeDrilldown = 'online';
  }

  toggleMaintenance(enabled: boolean): void {
    const action = enabled ? 'ACTIVATE' : 'DEACTIVATE';
    if (!confirm(`Are you sure you want to ${action} Global Maintenance Mode? This will block access for all non-superadmin users.`)) return;

    this.superAdminService.toggleMaintenanceMode(enabled).subscribe({
      next: (res) => {
        this.success = res.message;
        if (this.metrics) this.metrics.maintenanceMode = res.maintenanceMode;
        this.loadData(); // Refresh all metrics and directory
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to toggle maintenance mode';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }
}
