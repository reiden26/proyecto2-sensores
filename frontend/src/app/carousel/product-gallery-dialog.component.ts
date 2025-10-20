import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ProductGalleryData {
  images: { src: string; desc: string }[];
  currentIndex: number;
}

@Component({
  selector: 'app-product-gallery-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="gallery-dialog">
      <button mat-icon-button class="close" (click)="close()" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>

      <div class="gallery-layout">
        <div class="thumbs">
          <div 
            class="thumb"
            *ngFor="let img of data.images; index as i"
            [class.active]="i === index"
            (click)="index = i"
            >
            <img [src]="img.src" [alt]="img.desc" />
          </div>
        </div>

        <div class="viewer">
          <div class="zoom-frame" (mousemove)="onMove($event)" (mouseenter)="zoomIn()" (mouseleave)="zoomOut()">
            <img [src]="data.images[index].src" [alt]="data.images[index].desc" class="zoom-image"
                 [style.transform]="'scale(' + scale + ')'"
                 [style.transform-origin]="origin">
          </div>
          <div class="caption">{{ data.images[index].desc }}</div>
          <div class="nav">
            <button mat-icon-button (click)="prev()" aria-label="Anterior"><mat-icon>chevron_left</mat-icon></button>
            <button mat-icon-button (click)="next()" aria-label="Siguiente"><mat-icon>chevron_right</mat-icon></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gallery-dialog { position: relative; box-sizing: border-box; padding: 12px; background: var(--surface); color: var(--text); width: min(95vw, 1100px); max-width: 100%; max-height: 90vh; overflow: hidden; border-radius: 12px; }
    .close { position: absolute; top: 8px; right: 8px; z-index: 2; }

    .gallery-layout { display: grid; grid-template-columns: 120px 1fr; column-gap: 16px; align-items: start; }

    .thumbs { display: flex; flex-direction: column; gap: 12px; max-height: calc(90vh - 160px); overflow: auto; padding-right: 4px; }
    .thumb { border: 1px solid var(--border); border-radius: 10px; padding: 2px; cursor: pointer; background: #fff; flex: 0 0 auto; position: relative; overflow: visible; }
    .thumb img { width: 100%; height: 72px; object-fit: cover; border-radius: 8px; display: block; }
    .thumb.active { outline: 3px solid var(--color-secondary); outline-offset: 2px; }

    .viewer { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
    .zoom-frame { width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: #fff; }
    .zoom-image { width: 100%; height: 100%; object-fit: contain; transition: transform 0.15s ease-out; }

    .caption { color: var(--text-muted); text-align: center; width: 100%; }

    .nav { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 4px; }

    @media (max-width: 768px) {
      .gallery-dialog { width: 95vw; padding: 8px; }
      .gallery-layout { grid-template-columns: 1fr; }
      .thumbs { flex-direction: row; max-height: 96px; overflow: auto; }
      .thumb { width: 80px; }
      .zoom-frame { width: 100%; aspect-ratio: 16/10; }
    }
  `]
})
export class ProductGalleryDialogComponent {
  index: number;
  scale = 1;
  origin = '50% 50%';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProductGalleryData,
    private dialogRef: MatDialogRef<ProductGalleryDialogComponent>
  ) {
    this.index = data.currentIndex ?? 0;
  }

  close() { this.dialogRef.close(); }
  prev() { this.index = (this.index - 1 + this.data.images.length) % this.data.images.length; }
  next() { this.index = (this.index + 1) % this.data.images.length; }

  zoomIn() { this.scale = 1.6; }
  zoomOut() { this.scale = 1; this.origin = '50% 50%'; }

  onMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.origin = `${x}% ${y}%`;
  }
}
