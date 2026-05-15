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

              <button class="btn btn-primary btn-create" (click)="openCreateModal()">
                ➕ New Document
              </button>
            </div>

            <!-- Documents Table / Grid -->
            <div class="table-wrapper premium-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 25%;">Document _id</th>
                    <th style="width: 55%;">JSON Snapshot</th>
                    <th style="width: 20%; text-align: right;">Cloud Operations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of documents">
                    <td><code class="doc-id-tag">{{ doc._id }}</code></td>
                    <td>
                      <pre class="json-preview">{{ getDocSummary(doc) }}</pre>
                    </td>
                    <td style="text-align: right;">
                      <div class="doc-actions-flex">
                        <button class="btn btn-sm btn-edit" (click)="openEditModal(doc)">✏️ Edit</button>
                        <button class="btn btn-sm btn-delete" (click)="deleteDocument(doc._id)">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="documents.length === 0">
                    <td colspan="3" class="empty-state-row">No documents found in collection '{{ selectedCollection.name }}'.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <ng-template #noSelection>
            <div class="empty-state-workspace">
              <div class="empty-icon">🗄️</div>
              <h3>Select a MongoDB Collection</h3>
              <p>Choose a collection from the sidebar to inspect and control live database documents.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- JSON Document Editor / Creator Modal -->
      <div *ngIf="editorModalOpen" class="modal-overlay animate-in">
        <div class="editor-modal-box">
          <div class="modal-header-flex mb-4">
            <h3 class="editor-title">{{ isEditing ? '✏️ Edit Document' : '➕ Create New Document' }} (<code>{{ selectedCollection?.name }}</code>)</h3>
            <button class="close-btn" (click)="editorModalOpen = false">×</button>
          </div>
          <p class="text-xs text-muted mb-4">Edit the raw JSON structure below. Changes will be instantly synchronized with your MongoDB Atlas Cloud instance.</p>

          <div *ngIf="modalError" class="alert alert-error">{{ modalError }}</div>

          <textarea 
            class="form-input json-editor-textarea" 
            [(ngModel)]="rawJsonInput" 
            rows="14"
            spellcheck="false"
            placeholder="{ ... }">
          </textarea>

          <div class="modal-buttons-grid mt-4">
            <button class="btn btn-secondary cancel-btn" (click)="editorModalOpen = false">Cancel</button>
            <button class="btn btn-primary save-btn" (click)="saveDocument()">💾 Synchronize to Atlas</button>
          </div>
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
    .btn-create { background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 0 24px; border-radius: 12px; font-weight: 700; }

    /* Table & Actions */
    .premium-table-wrapper { border-radius: 16px; overflow: hidden; border: 1px solid var(--color-border); background: rgba(0,0,0,0.3); }
    .doc-id-tag { background: rgba(124, 58, 237, 0.15); color: #c084fc; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .json-preview { font-size: 12px; color: #cbd5e1; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; max-height: 80px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; margin: 0; }
    .doc-actions-flex { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-edit { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-edit:hover { background: #3b82f6; color: white; }
    .btn-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-delete:hover { background: #ef4444; color: white; }
    .empty-state-row { text-align: center; padding: 48px 0; color: var(--color-text-muted); font-size: 14px; }
    .empty-state-workspace { text-align: center; padding: 80px 32px; color: var(--color-text-muted); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

    /* Modal Editor */
    .editor-modal-box { width: 100%; max-width: 650px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 24px; padding: 36px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
    .modal-header-flex { display: flex; align-items: center; justify-content: space-between; }
    .editor-title { font-size: 20px; font-weight: 700; color: white; margin: 0; }
    .close-btn { background: none; border: none; color: var(--color-text-muted); font-size: 28px; cursor: pointer; }
    .close-btn:hover { color: white; }
    .json-editor-textarea { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 16px; font-family: monospace; font-size: 13px; color: #34d399; outline: none; transition: border-color 0.2s; }
    .json-editor-textarea:focus { border-color: #10b981; }
    .modal-buttons-grid { display: flex; gap: 16px; }
    .cancel-btn { flex: 1; padding: 14px; border-radius: 14px; font-weight: 600; }
    .save-btn { flex: 1; padding: 14px; border-radius: 14px; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); border: none; }
  `]
})
export class SuperAdminMongodbComponent implements OnInit {
  clusterData: any = null;
  selectedCollection: any = null;
  documents: any[] = [];
  error = '';
  success = '';

  // Editor Modal State
  editorModalOpen = false;
  isEditing = false;
  editingDocId: string | null = null;
  rawJsonInput = '';
  modalError = '';

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

  openCreateModal(): void {
    if (!this.selectedCollection) return;
    this.isEditing = false;
    this.editingDocId = null;
    this.modalError = '';
    this.rawJsonInput = '{\n  "name": "Example Field",\n  "status": "ACTIVE"\n}';
    this.editorModalOpen = true;
  }

  openEditModal(doc: any): void {
    if (!this.selectedCollection) return;
    this.isEditing = true;
    this.editingDocId = doc._id;
    this.modalError = '';
    const clone = { ...doc };
    delete clone._id;
    this.rawJsonInput = JSON.stringify(clone, null, 2);
    this.editorModalOpen = true;
  }

  saveDocument(): void {
    if (!this.selectedCollection) return;
    this.modalError = '';
    let parsedObj;
    try {
      parsedObj = JSON.parse(this.rawJsonInput);
    } catch (e: any) {
      this.modalError = `Invalid JSON syntax: ${e.message}`;
      return;
    }

    const colName = this.selectedCollection.name;
    if (this.isEditing && this.editingDocId) {
      this.superAdminService.updateDocument(colName, this.editingDocId, parsedObj).subscribe({
        next: (res) => {
          this.success = `💾 Document '${this.editingDocId}' synchronized in Atlas successfully.`;
          this.editorModalOpen = false;
          this.selectCollection(this.selectedCollection);
          setTimeout(() => this.success = '', 5000);
        },
        error: () => this.modalError = 'Failed to push update to MongoDB Atlas cluster.'
      });
    } else {
      this.superAdminService.createDocument(colName, parsedObj).subscribe({
        next: (res) => {
          this.success = `➕ New document inserted into '${colName}' successfully.`;
          this.editorModalOpen = false;
          this.selectCollection(this.selectedCollection);
          setTimeout(() => this.success = '', 5000);
        },
        error: () => this.modalError = 'Failed to insert document into MongoDB Atlas cluster.'
      });
    }
  }

  deleteDocument(docId: string): void {
    if (!this.selectedCollection || !confirm(`Delete document '${docId}' from Atlas Cloud?`)) return;
    this.error = ''; this.success = '';
    const colName = this.selectedCollection.name;

    this.superAdminService.deleteDocument(colName, docId).subscribe({
      next: (res) => {
        this.success = `🗑️ Document '${docId}' permanently deleted from Atlas Cloud.`;
        this.selectCollection(this.selectedCollection);
        setTimeout(() => this.success = '', 5000);
      },
      error: () => this.error = 'Failed to delete document from Atlas Cloud.'
    });
  }
}
