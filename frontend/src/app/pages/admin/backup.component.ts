import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../services/backup.service';
import { AppLayoutComponent } from '../../components/layout/app-layout/app-layout.component';

@Component({
  selector: 'app-admin-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, AppLayoutComponent],
  templateUrl: './backup.component.html',
  styles: [`
    .backup-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.75rem;
    }
    .status-panel {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 8px;
      padding: 1rem 1.25rem;
    }
    pre {
      background: #020617;
      padding: 1rem;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #94a3b8;
      overflow-x: auto;
    }
  `]
})
export class BackupComponent {
  exporting = false;
  verifying = false;
  error = '';
  success = '';
  
  // Verification data
  validationResult: any = null;
  verifyError = '';

  constructor(private backupService: BackupService) {}

  triggerBackup(): void {
    this.exporting = true;
    this.error = '';
    this.success = '';

    this.backupService.exportBackup().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `energi_backup_export_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.success = 'Encrypted backup file generated and downloaded successfully.';
      },
      error: (err) => {
        console.error('Backup failed', err);
        this.error = 'Failed to generate backup. Please try again.';
      },
      complete: () => {
        this.exporting = false;
      }
    });
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    this.verifying = true;
    this.verifyError = '';
    this.validationResult = null;

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        this.backupService.verifyBackup(json).subscribe({
          next: (res) => {
            if (res.success) {
              this.validationResult = res.validation;
            } else {
              this.verifyError = res.error || 'Verification failed';
            }
          },
          error: (err) => {
            this.verifyError = err.error?.error || 'Invalid backup payload or signature authentication failed.';
            this.verifying = false;
          },
          complete: () => {
            this.verifying = false;
          }
        });
      } catch (err) {
        this.verifyError = 'Failed to parse backup file. Please make sure it is a valid EnergI backup file.';
        this.verifying = false;
      }
    };

    reader.readAsText(file);
    input.value = ''; // Reset input selection
  }
}
