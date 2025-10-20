import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface ConfirmDeleteData {
  title: string;
  message: string;
  itemName: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        <div class="item-info">
          <strong>{{ data.itemName }}</strong>
        </div>
        <p class="warning-text">Esta acción no se puede deshacer.</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-btn">
          <mat-icon>delete</mat-icon>
          Eliminar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 400px;
      max-width: 500px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 0 24px;
    }
    
    .warning-icon {
      color: #f44336;
      font-size: 28px;
      width: 28px;
      height: 28px;
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
    
    .item-info {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid #2196f3;
    }
    
    .item-info strong {
      color: #333;
      font-size: 1.1rem;
    }
    
    .warning-text {
      color: #f44336;
      font-weight: 500;
      margin-top: 16px;
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
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
