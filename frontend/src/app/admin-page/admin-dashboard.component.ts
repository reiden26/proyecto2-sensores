import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from './admin-navbar.component';
import { UsuarioService } from '../services/usuario.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminNavbarComponent, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentRoute: string = '';
  showSidebar: boolean = true;
  showLogoutConfirm: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
    this.currentRoute = this.router.url;
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  navigateTo(route: string): void {
    this.router.navigate(['/admin', route]);
  }

  isActiveRoute(route: string): boolean {
    if (route === '/admin' || route === '/admin/dashboard') {
      return this.currentRoute === '/admin' || this.currentRoute === '/admin/dashboard';
    }
    return this.currentRoute.includes(route);
  }

  openLogoutConfirm(): void {
    this.showLogoutConfirm = true;
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  acceptLogout(): void {
    // Llamar al endpoint de logout del backend
    this.usuarioService.logout().subscribe({
      next: () => {
        // Navegar al inicio
        this.router.navigate(['/']);
        // Cerrar modal
        this.showLogoutConfirm = false;
      },
      error: (error) => {
        console.error('Error en logout:', error);
        // Aunque falle, navegar al inicio
        this.router.navigate(['/']);
        this.showLogoutConfirm = false;
      }
    });
  }
}
