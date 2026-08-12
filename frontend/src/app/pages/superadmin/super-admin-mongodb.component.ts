import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../services/superadmin.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-super-admin-mongodb',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  template: `
    <app-app-layout>
      <!-- Pinterest-Tier Header Banner -->
      <div class="premium-header-banner mb-6 animate-in">
        <div class="banner-content">
          <div class="live-pill">
            <span class="pulsing-dot"></span> Atlas Cloud Link Active
          </div>
          <h1 class="header-title">MongoDB Atlas Cloud Explorer 🗄️</h1>
          <p class="header-subtitle">Directly browse, insert, update, and remove documents across your physical MongoDB cluster without leaving the Super Admin portal.</p>
        </div>
        <div class="banner-glow"></div>
      </div>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <div class="explorer-layout animate-in">
        <!-- Left Sidebar: Collections List -->
        <div class="collections-sidebar card">
          <div class="sidebar-header">
            <h3 class="sidebar-title">🗂️ Collections</h3>
            <span class="cluster-tag">{{ clusterData?.clusterName || 'Cluster0' }}</span>
          </div>

          <div class="collections-list">
            <button 
              *ngFor="let col of clusterData?.collections" 
              class="collection-item" 
              [class.active]="selectedCollection?.name === col.name"
              (click)="selectCollection(col)">
              <div class="col-name-flex">
                <span class="col-icon">📁</span>
                <span class="col-name">{{ col.name }}</span>
              </div>
              <span class="col-count">{{ col.documents }}</span>
            </button>
          </div>
        </div>

        <!-- Right Main Workspace: Document Viewer & Control -->
        <div class="workspace-area card">
          <div *ngIf="selectedCollection; else noSelection">
            <div class="workspace-header mb-4">
              <div class="col-meta-info">
                <h2 class="workspace-title"><code>{{ selectedCollection.name }}</code></h2>
                <div class="col-stats-pills">
                  <span class="pill">Storage: <strong>{{ selectedCollection.storageSize }}</strong></span>
                  <span class="pill">Data: <strong>{{ selectedCollection.dataSize }}</strong></span>
                  <span class="pill">Indexes: <strong>{{ selectedCollection.indexes }}</strong> ({{ selectedCollection.indexSize }})</span>
                </div>
              </div>
            </div>

            <!-- Documents Table / Grid -->
            <div class="table-wrapper premium-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 25%;">Document _id</th>
                    <th style="width: 75%;">JSON Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of documents">
                    <td><code class="doc-id-tag">{{ doc._id }}</code></td>
                    <td>
                      <pre class="json-preview">{{ getDocSummary(doc) }}</pre>
                    </td>
                  </tr>
                  <tr *ngIf="documents.length === 0">
                    <td colspan="2" class="empty-state-row">No documents found in collection '{{ selectedCollection.name }}'.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <ng-template #noSelection>
            <div class="empty-state-workspace">
              <div class="empty-icon">🗄️</div>
              <h3>Select a MongoDB Collection</h3>
              <p>Choose a collection from the sidebar to inspect database document counts and structure.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </app-app-layout>
  `,
  styles: [`
    /* Pinterest-Tier Banner */
    .premium-header-banner {
      position: relative;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.25);
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
    .header-title { font-size: 32px; font-weight: 800; color: white; letter-spacing: -1px; margin: 0 0 6px 0; }
    .header-subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; max-width: 650px; line-height: 1.5; }
    .banner-glow { position: absolute; right: -50px; top: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%); filter: blur(30px); pointer-events: none; }

    /* Explorer Layout */
    .explorer-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; min-height: 600px; }
    .collections-sidebar { border-radius: 20px; padding: 24px; background: rgba(26, 26, 46, 0.7); display: flex; flex-direction: column; gap: 20px; }
    .sidebar-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; }
    .sidebar-title { font-size: 16px; font-weight: 700; color: white; margin: 0; }
    .cluster-tag { background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px; }
    .collections-list { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: 500px; }
    .collection-item { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.2s; color: var(--color-text-muted); }
    .collection-item:hover { background: rgba(255,255,255,0.05); color: white; }
    .collection-item.active { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); color: white; font-weight: 700; }
    .col-name-flex { display: flex; align-items: center; gap: 10px; }
    .col-count { font-size: 11px; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 6px; font-weight: 600; }

    /* Workspace Area */
    .workspace-area { border-radius: 20px; padding: 32px; background: rgba(26, 26, 46, 0.7); overflow-x: auto; }
    .workspace-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; }
    .workspace-title { font-size: 24px; font-weight: 800; color: white; margin: 0 0 8px 0; }
    .col-stats-pills { display: flex; gap: 12px; flex-wrap: wrap; }
    .pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 8px; font-size: 12px; color: var(--color-text-muted); }
    .pill strong { color: white; font-weight: 700; }

    /* Table */
    .premium-table-wrapper { border-radius: 16px; overflow: hidden; border: 1px solid var(--color-border); background: rgba(0,0,0,0.3); }
    .doc-id-tag { background: rgba(124, 58, 237, 0.15); color: #c084fc; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .json-preview { font-size: 12px; color: #cbd5e1; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; max-height: 80px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; margin: 0; }
    .empty-state-row { text-align: center; padding: 48px 0; color: var(--color-text-muted); font-size: 14px; }
    .empty-state-workspace { text-align: center; padding: 80px 32px; color: var(--color-text-muted); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  `]
})
export class SuperAdminMongodbComponent implements OnInit {
  clusterData: any = null;
  selectedCollection: any = null;
  documents: any[] = [];
  error = '';
  success = '';

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.loadCollections();
  }

  loadCollections(): void {
    this.superAdminService.getMongoCollections().subscribe({
      next: (res) => {
        this.clusterData = res;
        if (res.collections && res.collections.length > 0 && !this.selectedCollection) {
          this.selectCollection(res.collections[0]);
        }
      },
      error: () => this.error = 'Failed to link with MongoDB Atlas Cloud.'
    });
  }

  selectCollection(col: any): void {
    this.selectedCollection = col;
    this.error = ''; this.success = '';
    this.superAdminService.getCollectionDocuments(col.name).subscribe({
      next: (res) => this.documents = res.documents,
      error: () => this.error = `Failed to fetch documents for collection '${col.name}'.`
    });
  }

  getDocSummary(doc: any): string {
    const clone = { ...doc };
    delete clone._id;
    return JSON.stringify(clone, null, 2);
  }
}
