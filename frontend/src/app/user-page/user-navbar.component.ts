import { Component, OnInit, OnDestroy, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'user-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatMenuModule, MatButtonModule, MatDividerModule],
  template: `
    <mat-toolbar class="user-toolbar">
      <div class="nav-left">
        <button mat-icon-button [matMenuTriggerFor]="navMenu" aria-label="Abrir menú de navegación" class="glass-icon-btn">
          <mat-icon>menu</mat-icon>
        </button>
        <mat-menu #navMenu="matMenu">
          <button mat-menu-item (click)="goToUser()">
            <mat-icon>home</mat-icon>
            <span>Panel Principal</span>
          </button>
          <button mat-menu-item (click)="goToUserData()">
            <mat-icon>table_chart</mat-icon>
            <span>Consulta de Datos</span>
          </button>
          <button mat-menu-item (click)="goToUserSensors()">
            <mat-icon>build</mat-icon>
            <span>Sensores</span>
          </button>
        </mat-menu>
      </div>

      <span class="spacer"></span>

      <div class="nav-right">
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-trigger">
          <mat-icon>person</mat-icon>
          <span class="user-name">{{ nombreUsuario }}</span>
          <mat-icon>expand_more</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu" xPosition="before">
          <button mat-menu-item [routerLink]="['/usuario/configuracion']">
            <span>Configuración</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="openLogoutConfirm()">
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>

    <!-- Overlay de confirmación de logout -->
    <div *ngIf="showConfirm" class="confirm-overlay">
      <div class="confirm-card">
        <h4>¿Cerrar sesión?</h4>
        <p>Perderás tu sesión actual y volverás al inicio.</p>
        <div class="confirm-actions">
          <button class="btn-secondary" (click)="cancelLogout()">Cancelar</button>
          <button class="btn-primary" (click)="acceptLogout()">Sí, salir</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./user-navbar.component.css']
})
export class UserNavbarComponent implements OnInit, OnDestroy {
  showDropdown = false;
  showConfirm = false;
  nombreUsuario: string = '';
  private isBrowser: boolean;
  
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  ngOnInit() {
    if (this.isBrowser) {
      // Cargar nombre del usuario desde el token
      this.cargarNombreUsuario();
      // Agregar event listener para cerrar dropdown al hacer clic fuera
      document.addEventListener('click', this.onDocumentClick.bind(this));
      // Escuchar eventos de actualización del usuario
      window.addEventListener('userUpdated', this.onUserUpdated.bind(this));
    }
  }
  
  ngOnDestroy() {
    if (this.isBrowser) {
      // Remover event listener al destruir el componente
      document.removeEventListener('click', this.onDocumentClick.bind(this));
      window.removeEventListener('userUpdated', this.onUserUpdated.bind(this));
    }
  }

  cargarNombreUsuario(): void {
    try {
      const userPayload = localStorage.getItem('user_payload');
      if (userPayload) {
        const payload = JSON.parse(userPayload);
        this.nombreUsuario = payload.nombre || 'Usuario';
      }
    } catch (error) {
      console.error('Error al cargar nombre del usuario:', error);
      this.nombreUsuario = 'Usuario';
    }
  }

  onUserUpdated(event: any): void {
    // Actualizar el nombre del usuario cuando se modifique
    this.cargarNombreUsuario();
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showDropdown = false;
    }
  }
  
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
  
  goToUser() {
    this.router.navigate(['/usuario']);
    this.showDropdown = false;
  }
  
  goToUserData() {
    this.router.navigate(['/usuario/datos']);
    this.showDropdown = false;
  }
  
  goToUserSensors() {
    this.router.navigate(['/usuario/sensores']);
    this.showDropdown = false;
  }
  
  openLogoutConfirm() { this.showConfirm = true; }
  cancelLogout() { this.showConfirm = false; }
  acceptLogout() {
    this.showConfirm = false;
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
}
