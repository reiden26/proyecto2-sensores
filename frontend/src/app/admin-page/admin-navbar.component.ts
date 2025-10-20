import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationBellComponent } from '../shared/notification-bell/notification-bell.component';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, NotificationBellComponent],
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css']
})
export class AdminNavbarComponent implements OnInit, OnDestroy {
  nombreUsuario: string = 'Usuario';
  usuario: any = null;
  private isBrowser: boolean;
  isDropdownOpen: boolean = false;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.obtenerNombreUsuario();
      this.obtenerUsuarioCompleto();
      // Escuchar eventos de actualización del usuario
      window.addEventListener('userUpdated', this.onUserUpdated.bind(this));
      // Cerrar dropdown al hacer click fuera
      document.addEventListener('click', this.onDocumentClick.bind(this));
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('userUpdated', this.onUserUpdated.bind(this));
      document.removeEventListener('click', this.onDocumentClick.bind(this));
    }
  }

  onUserUpdated(event: any): void {
    if (event.detail && event.detail.nombre) {
      this.nombreUsuario = event.detail.nombre;
    }
    if (event.detail && event.detail.imagen_url) {
      this.usuario.imagen_url = event.detail.imagen_url;
    }
  }

  obtenerNombreUsuario(): void {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.nombreUsuario = payload.nombre || 'Usuario';
      }
    } catch (error) {
      console.error('Error al obtener nombre del usuario:', error);
      this.nombreUsuario = 'Usuario';
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.user-info');
    if (!dropdown) {
      this.isDropdownOpen = false;
    }
  }

  private obtenerUsuarioCompleto() {
    // Obtener datos del usuario desde el token (incluye imagen_url)
    try {
      if (!this.isBrowser) return;

      const token = localStorage.getItem('token');
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.usuario = {
        id: payload.user_id,
        nombre: payload.nombre,
        email: payload.sub,
        rol: payload.rol,
        imagen_url: payload.imagen_url
      };
      
      // debug removido
    } catch (e) {
      console.error('Error al obtener datos del token:', e);
    }
  }

  logout(): void {
    // Llamar endpoint /logout y luego llevar a landing
    try {
      this.usuarioService.logout().subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: () => {
          // Incluso si falla, limpiar y llevar a landing
          if (this.isBrowser) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_payload');
          }
          this.router.navigate(['/']);
        }
      });
    } catch {
      if (this.isBrowser) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_payload');
      }
      this.router.navigate(['/']);
    }
  }

}
