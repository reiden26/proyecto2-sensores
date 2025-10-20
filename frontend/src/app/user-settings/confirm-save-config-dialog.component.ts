import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmSaveConfigData {
  title: string;
  message: string;
  icon?: string;
  isAdmin?: boolean;
}

@Component({
  selector: 'app-confirm-save-config-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="success-icon" [class.admin-icon]="isAdmin">{{ data.icon || 'save' }}</mat-icon>
        <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      </div>
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="primary" (click)="onConfirm()" class="confirm-btn">
          <mat-icon>save</mat-icon>
          Guardar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog { min-width: 380px; max-width: 500px; }
    .dialog-header { display:flex; align-items:center; gap:6px; padding:24px 24px 0 24px; }
    .success-icon { color: #4CAF50; font-size: 28px; width: 28px; height: 28px; }
    .admin-icon { color: #1e88e5 !important; }
    .dialog-header h2 { margin:0; color:#1f2937; font-size:1.4rem; font-weight:600; }
    .dialog-title { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dialog-content { padding:16px 24px; color:#4b5563; }
    .dialog-actions { padding:16px 24px 24px 24px; justify-content:flex-end; gap:12px; }
    .cancel-btn { color:#6b7280; }
    :host-context(.admin-confirm-dialog) .confirm-btn { background: #1e88e5; color: #fff; }
    .cancel-btn mat-icon, .confirm-btn mat-icon { margin-right:4px; }
    :host-context(.admin-confirm-dialog) .confirm-btn mat-icon { color:#ffffff !important; opacity:1; }
    .confirm-btn mat-icon, .cancel-btn mat-icon {
      width: 20px; height: 20px; font-size: 20px; line-height: 20px; display:inline-block;
      font-family: 'Material Icons' !important; font-style: normal; font-weight: normal; letter-spacing: normal;
      text-transform: none; white-space: nowrap; word-wrap: normal; direction: ltr;
      -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
      -moz-osx-font-smoothing: grayscale; font-feature-settings: 'liga';
    }
    @media (max-width:600px){
      .confirm-dialog{ min-width:300px; max-width:90vw; }
      .dialog-header{ padding:16px 16px 0 16px; }
      .dialog-content{ padding:12px 16px; }
      .dialog-actions{ padding:12px 16px 16px 16px; flex-direction:column; }
      .dialog-actions button{ width:100%; }
    }
  `]
})
export class ConfirmSaveConfigDialogComponent {
  isAdmin: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmSaveConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmSaveConfigData
  ) {
    // Detectar si el usuario es administrador desde el token
    this.checkAdminRole();
  }

  private checkAdminRole(): void {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Decodificar el token JWT para obtener el rol
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.isAdmin = payload.rol === 'admin';
      }
    } catch (error) {
      this.isAdmin = false;
    }
  }

  onCancel(): void { this.dialogRef.close(false); }
  onConfirm(): void { this.dialogRef.close(true); }
}


