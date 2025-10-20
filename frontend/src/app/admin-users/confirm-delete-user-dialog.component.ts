import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';

export interface ConfirmDeleteUserData {
  title: string;
  message: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userSensors: string[];
}

@Component({
  selector: 'app-confirm-delete-user-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">person_remove</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        
        <div class="user-info">
          <div class="user-details">
            <div class="user-name">
              <mat-icon>person</mat-icon>
              <strong>{{ data.userName }}</strong>
            </div>
            <div class="user-email">
              <mat-icon>email</mat-icon>
              <span>{{ data.userEmail }}</span>
            </div>
            <div class="user-role">
              <mat-icon>admin_panel_settings</mat-icon>
              <span class="role-badge" [class.admin-role]="data.userRole === 'admin'">
                {{ data.userRole === 'admin' ? 'Administrador' : 'Usuario' }}
              </span>
            </div>
          </div>
          
          <div class="user-sensors" *ngIf="data.userSensors.length > 0">
            <h4>Sensores asignados:</h4>
            <mat-chip-set>
              <mat-chip *ngFor="let sensor of data.userSensors" 
                        [class.mq135]="sensor.includes('MQ-135')"
                        [class.mq4]="sensor.includes('MQ-4')"
                        [class.mq7]="sensor.includes('MQ-7')">
                {{ sensor }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
        
        <div class="warning-section">
          <mat-icon class="warning-icon-small">warning</mat-icon>
          <p class="warning-text">
            <strong>Advertencia:</strong> Esta acción eliminará permanentemente al usuario y todos sus datos asociados. 
            Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-btn">
          <mat-icon>person_remove</mat-icon>
          Eliminar Usuario
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 500px;
      max-width: 600px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 0 24px;
    }
    
    .warning-icon {
      color: #f44336;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    .dialog-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .dialog-content {
      padding: 16px 24px;
      color: #666;
      line-height: 1.5;
    }
    
    .user-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
      border-left: 4px solid #2196f3;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .user-name, .user-email, .user-role {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .user-name mat-icon {
      color: #2196f3;
    }
    
    .user-email mat-icon {
      color: #4caf50;
    }
    
    .user-role mat-icon {
      color: #ff9800;
    }
    
    .user-name strong {
      color: #333;
      font-size: 1.2rem;
    }
    
    .role-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .role-badge.admin-role {
      background: #fff3e0;
      color: #f57c00;
    }
    
    .user-sensors h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .user-sensors mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .user-sensors mat-chip {
      font-size: 0.85rem;
    }
    
    .user-sensors mat-chip.mq135 {
      background: #e8f5e8;
      color: #2e7d32;
    }
    
    .user-sensors mat-chip.mq4 {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .user-sensors mat-chip.mq7 {
      background: #fff3e0;
      color: #f57c00;
    }
    
    .warning-section {
      background: #ffebee;
      border: 1px solid #ffcdd2;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .warning-icon-small {
      color: #f44336;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }
    
    .warning-text {
      margin: 0;
      color: #c62828;
      font-size: 0.95rem;
      line-height: 1.4;
    }
    
    .dialog-actions {
      padding: 16px 24px 24px 24px;
      justify-content: flex-end;
      gap: 12px;
    }
    
    .cancel-btn {
      color: #666;
    }
    
    .cancel-btn mat-icon {
      margin-right: 8px;
    }
    
    .confirm-btn mat-icon {
      margin-right: 8px;
    }
    
    @media (max-width: 600px) {
      .confirm-dialog {
        min-width: 300px;
        max-width: 90vw;
      }
      
      .dialog-header {
        padding: 16px 16px 0 16px;
      }
      
      .dialog-content {
        padding: 12px 16px;
      }
      
      .user-info {
        padding: 16px;
      }
      
      .user-details {
        gap: 8px;
      }
      
      .dialog-actions {
        padding: 12px 16px 16px 16px;
        flex-direction: column;
      }
      
      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class ConfirmDeleteUserDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteUserData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
