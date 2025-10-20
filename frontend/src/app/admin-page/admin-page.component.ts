import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNavbarComponent } from './admin-navbar.component';

@Component({
  selector: 'admin-page',
  standalone: true,
  imports: [CommonModule, AdminNavbarComponent],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent implements OnInit, OnDestroy {
  public nombre: string = '';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.obtenerNombreUsuario();
    if (this.isBrowser) {
      // Escuchar eventos de actualización del usuario
      window.addEventListener('userUpdated', this.onUserUpdated.bind(this));
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('userUpdated', this.onUserUpdated.bind(this));
    }
  }

  onUserUpdated(event: any): void {
    if (event.detail && event.detail.nombre) {
      this.nombre = event.detail.nombre;
    }
  }

  private obtenerNombreUsuario() {
    try {
      if (!this.isBrowser) return;

      // Preferir payload cacheado
      const cached = localStorage.getItem('user_payload');
      if (cached) {
        const payload = JSON.parse(cached);
        this.nombre = payload.nombre || 'Usuario';
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      this.nombre = payload.nombre || 'Usuario';
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      this.nombre = '';
    }
  }
}

export default AdminPageComponent;
