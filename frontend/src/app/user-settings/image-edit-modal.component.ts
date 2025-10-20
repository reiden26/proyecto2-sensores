import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../shared/notification/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-image-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="image-edit-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>image</mat-icon>
          Cambiar imagen de perfil
        </h2>
        <button mat-icon-button (click)="cerrar()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div class="current-image-section">
          <div class="current-image-label">Imagen actual:</div>
          <div class="current-image-preview">
            <img *ngIf="data.currentImage" [src]="data.currentImage" [alt]="'Imagen actual'" class="current-image">
            <mat-icon *ngIf="!data.currentImage" class="current-image-placeholder">person</mat-icon>
          </div>
        </div>

        <mat-tab-group [(selectedIndex)]="selectedTab" class="image-tabs">
          <mat-tab label="URL">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>URL de la imagen</mat-label>
                <input matInput 
                       [(ngModel)]="nuevaImagenUrl" 
                       placeholder="https://ejemplo.com/imagen.jpg"
                       (input)="onUrlChange()">
                <mat-hint>Pega la URL de tu imagen</mat-hint>
              </mat-form-field>
              
              <div class="url-preview" *ngIf="nuevaImagenUrl && !imageError">
                <div class="preview-label">Vista previa:</div>
                <img [src]="nuevaImagenUrl" 
                     [alt]="'Vista previa'" 
                     class="preview-image"
                     (error)="onImageError()"
                     (load)="onImageLoad()">
              </div>
              
              <div class="error-message" *ngIf="imageError">
                <mat-icon>error</mat-icon>
                <span>No se pudo cargar la imagen desde esta URL</span>
              </div>
            </div>
          </mat-tab>
          
          <mat-tab label="Subir archivo">
            <div class="tab-content">
              <div class="upload-area" 
                   (click)="fileInput.click()" 
                   [class.dragover]="isDragOver"
                   (dragover)="onDragOver($event)" 
                   (dragleave)="onDragLeave($event)" 
                   (drop)="onDrop($event)">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p class="upload-text">Arrastra una imagen aquí o haz clic para seleccionar</p>
                <p class="upload-hint">Formatos: JPG, PNG, GIF. Máximo 5MB</p>
              </div>
              
              <input #fileInput 
                     type="file" 
                     accept="image/*" 
                     (change)="onFileSelected($event)" 
                     style="display: none;">
              
              <div class="file-preview" *ngIf="selectedFile">
                <div class="preview-label">Archivo seleccionado:</div>
                <img [src]="selectedFilePreview" [alt]="'Vista previa'" class="preview-image">
                <p class="file-info">{{ selectedFile.name }}</p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-stroked-button (click)="cerrar()" [disabled]="isLoading">
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="guardar()" 
                [disabled]="!puedeGuardar() || isLoading">
          <mat-icon *ngIf="!isLoading">save</mat-icon>
          <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
          {{ isLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .image-edit-modal {
      width: 100%;
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .current-image-section {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .current-image-label {
      font-weight: 500;
      color: #666;
      margin-bottom: 12px;
    }

    .current-image-preview {
      display: inline-block;
    }

    .current-image,
    .current-image-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: contain;
      border: 3px solid #e0e0e0;
      background: #f5f5f5;
    }

    .current-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 2rem;
    }

    .image-tabs {
      margin-top: 20px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .url-preview,
    .file-preview {
      text-align: center;
      margin-top: 16px;
    }

    .preview-label {
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    .preview-image {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background: #ffebee;
      padding: 12px;
      border-radius: 8px;
      margin-top: 12px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 12px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: #4CAF50;
      background: #f0f8f0;
    }

    .upload-icon {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .upload-area:hover .upload-icon,
    .upload-area.dragover .upload-icon {
      color: #4CAF50;
    }

    /* Colores del botón guardar */
    .modal-actions button[mat-raised-button][color="primary"] {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
    }

    .modal-actions button[mat-raised-button][color="primary"]:hover {
      background: linear-gradient(135deg, #45a049 0%, #388e3c 100%) !important;
      box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4) !important;
    }

    .modal-actions button[mat-raised-button][color="primary"]:disabled {
      background: #e0e0e0 !important;
      color: #9e9e9e !important;
      box-shadow: none !important;
    }

    .upload-text {
      font-weight: 500;
      color: #333;
      margin: 0 0 8px 0;
    }

    .upload-hint {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }

    .file-info {
      margin-top: 8px;
      color: #666;
      font-size: 0.9rem;
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
      gap: 12px;
    }

    .modal-actions button {
      min-width: 100px;
    }
  `]
})
export class ImageEditModalComponent {
  selectedTab = 0;
  nuevaImagenUrl = '';
  selectedFile: File | null = null;
  selectedFilePreview = '';
  isDragOver = false;
  imageError = false;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<ImageEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentImage: string },
    private notifications: NotificationService,
    private http: HttpClient
  ) {}

  cerrar() {
    this.dialogRef.close();
  }

  onUrlChange() {
    this.imageError = false;
  }

  onImageError() {
    this.imageError = true;
  }

  onImageLoad() {
    this.imageError = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.notifications.showError('Error', 'Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.notifications.showError('Error', 'El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    this.selectedFile = file;
    this.selectedTab = 1;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedFilePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  puedeGuardar(): boolean {
    return (this.nuevaImagenUrl && !this.imageError) || this.selectedFile !== null;
  }

  guardar() {
    if (!this.puedeGuardar()) return;

    this.isLoading = true;
    
    if (this.selectedFile) {
      // Subir archivo a Cloudinary
      this.subirArchivoACloudinary();
    } else {
      this.actualizarImagen(this.nuevaImagenUrl);
    }
  }

  private subirArchivoACloudinary() {
    if (!this.selectedFile) return;

    // Crear FormData para subir el archivo
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', 'ml_default'); // Usar tu preset de Cloudinary

    // Subir a Cloudinary
    this.http.post('https://api.cloudinary.com/v1_1/duzmmuisk/image/upload', formData)
      .subscribe({
        next: (response: any) => {
          if (response.secure_url) {
            this.actualizarImagen(response.secure_url);
          } else {
            this.notifications.showError('Error', 'No se pudo subir la imagen');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error al subir a Cloudinary:', error);
          this.notifications.showError('Error', 'No se pudo subir la imagen a Cloudinary');
          this.isLoading = false;
        }
      });
  }

  private actualizarImagen(url: string) {
    const token = localStorage.getItem('token');
    const userId = this.getUserIdFromToken();
    
    if (!token || !userId) {
      this.notifications.showError('Error', 'No se pudo identificar al usuario');
      this.isLoading = false;
      return;
    }

    this.http.put(`${environment.apiBaseUrl}/usuarios/${userId}`, {
      imagen_url: url
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        this.notifications.showSuccess('Éxito', 'Imagen actualizada correctamente');
        
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new CustomEvent('userUpdated', { 
          detail: { 
            imagen_url: url 
          } 
        }));
        
        this.dialogRef.close(url);
        this.isLoading = false;
      },
      error: (error) => {
        this.notifications.showError('Error', 'No se pudo actualizar la imagen');
        this.isLoading = false;
      }
    });
  }

  private getUserIdFromToken(): number | null {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch (e) {
      return null;
    }
  }
}
