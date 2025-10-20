import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { UsuarioService } from '../services/usuario.service';
import { filter } from 'rxjs/operators';
import { NotificationBellComponent } from '../shared/notification-bell/notification-bell.component';

@Component({
  selector: 'user-page',
  standalone: true,
  imports: [
    CommonModule, 
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    MatButtonModule, 
    RouterModule, 
    MatMenuModule, 
    MatDividerModule,
    NotificationBellComponent
  ],
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.css']
})
export class UserPageComponent implements OnInit, OnDestroy {
  public nombre: string = 'Usuario';
  public usuario: any = null;
  public showSidebar: boolean = true;
  public showLogoutConfirm: boolean = false;
  public currentRoute: string = '';
  public isDropdownOpen: boolean = false;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.obtenerNombreUsuario();
    this.obtenerUsuarioCompleto();
    if (this.isBrowser) {
      // Escuchar eventos de actualización del usuario
      window.addEventListener('userUpdated', this.onUserUpdated.bind(this));
      
      // Escuchar clicks fuera del dropdown
      document.addEventListener('click', this.onDocumentClick.bind(this));
      
      // Suscribirse a cambios de ruta
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.currentRoute = event.url;
        });
    }
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('userUpdated', this.onUserUpdated.bind(this));
      document.removeEventListener('click', this.onDocumentClick.bind(this));
    }
  }

  onUserUpdated(event: any): void {
    if (event.detail && event.detail.nombre) {
      this.nombre = event.detail.nombre;
    }
    if (event.detail && event.detail.imagen_url) {
      this.usuario.imagen_url = event.detail.imagen_url;
    }
  }

  private obtenerNombreUsuario() {
    try {
      if (!this.isBrowser) return;

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
    } catch (e) {
      this.nombre = 'Usuario';
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
      
      console.log('Usuario en menú lateral:', this.usuario);
      console.log('Imagen URL:', this.usuario.imagen_url);
    } catch (e) {
      console.error('Error al obtener datos del token:', e);
    }
  }

  // Métodos para el sidebar
  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  navigateTo(route: string) {
    this.router.navigate([`/usuario/${route}`]);
  }

  isActiveRoute(route: string): boolean {
    // Para el panel principal, solo activo si está exactamente en /usuario
    if (route === '/usuario') {
      return this.currentRoute === '/usuario';
    }
    // Para otras rutas, usar includes como antes
    return this.currentRoute.includes(route);
  }

  // Métodos para el logout
  openLogoutConfirm() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  acceptLogout() {
    this.showLogoutConfirm = false;
    // Llamar al endpoint de logout del backend
    this.usuarioService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error en logout:', error);
        // Aunque falle, navegar al inicio
        this.router.navigate(['/']);
      }
    });
  }

  // Métodos para el dropdown del usuario
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
}
