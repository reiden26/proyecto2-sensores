import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  template: `
    <div class="export-modal">
      <h2 mat-dialog-title>Seleccionar Formato de Exportación</h2>
      
      <mat-dialog-content>
        <p>Elige el formato en el que deseas descargar tu reporte:</p>
        
        <div class="export-options">
          <mat-card class="export-option" [class.disabled]="data?.filters?.incluirGraficos" (click)="onClick('csv')">
            <mat-card-content>
              <div class="option-content">
                <mat-icon>table_chart</mat-icon>
                <div class="option-text">
                  <h3>CSV</h3>
                  <p>Archivo de texto separado por comas</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="export-option" [class.disabled]="data?.filters?.incluirGraficos" (click)="onClick('json')">
            <mat-card-content>
              <div class="option-content">
                <mat-icon>code</mat-icon>
                <div class="option-text">
                  <h3>JSON</h3>
                  <p>Formato de datos estructurado</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="export-option" (click)="seleccionarFormato('pdf')">
            <mat-card-content>
              <div class="option-content">
                <mat-icon>picture_as_pdf</mat-icon>
                <div class="option-text">
                  <h3>PDF</h3>
                  <p>Documento portable con gráficos</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="export-option" (click)="seleccionarFormato('excel')">
            <mat-card-content>
              <div class="option-content">
                <mat-icon>table_view</mat-icon>
                <div class="option-text">
                  <h3>Excel</h3>
                  <p>Hoja de cálculo de Microsoft</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="cancelar()">Cancelar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .export-modal {
      padding: 0;
      overflow: hidden;
    }

    h2 {
      color: #1976d2;
      margin-bottom: 12px;
      font-size: 1.4rem;
      font-weight: 500;
    }

    p {
      color: #666;
      margin-bottom: 16px;
      font-size: 0.95rem;
    }

    .export-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .export-option {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      min-height: 80px;
    }

    .export-option.disabled {
      cursor: not-allowed;
      opacity: 0.5;
      pointer-events: none;
    }

    .export-option:hover {
      border-color: #1976d2;
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
      transform: translateY(-2px);
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      min-height: 60px;
    }

    .option-content mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .option-text h3 {
      margin: 0 0 2px 0;
      color: #333;
      font-size: 1rem;
      font-weight: 500;
    }

    .option-text p {
      margin: 0;
      color: #666;
      font-size: 0.85rem;
    }

    mat-dialog-actions {
      justify-content: flex-end;
      padding: 12px 0 0 0;
    }

    mat-dialog-actions button {
      color: #666;
      font-weight: 500;
    }
  `]
})
export class ExportModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ExportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  seleccionarFormato(formato: string) {
    this.dialogRef.close(formato);
  }

  onClick(formato: string) {
    if (this.data?.filters?.incluirGraficos) {
      return; // desactivado cuando incluyen gráficos
    }
    this.seleccionarFormato(formato);
  }

  cancelar() {
    this.dialogRef.close();
  }
}
