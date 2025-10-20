import { Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { ProjectInfoComponent } from './project-info/project-info.component';
import { CarouselComponent } from './carousel/carousel.component';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer/footer.component';
import { HttpClientModule } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { NotificationComponent } from './shared/notification/notification.component';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ProjectInfoComponent, CarouselComponent, FooterComponent, HttpClientModule, NotificationComponent, MatProgressSpinnerModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  bootBlocking = true;
  
  constructor(
    private router: Router,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit() {
    // Mostrar spinner hasta que termine la primera navegación resuelta por guards/canMatch
    let firstNavDone = false;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (!firstNavDone) {
        firstNavDone = true;
        this.bootBlocking = false;
        // Ocultar splash global de index.html (solo en navegador)
        try {
          if (isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
            const splash = document.getElementById('global-splash');
            if (splash) splash.style.display = 'none';
          }
        } catch {}
      }
      // Cerrar cualquier diálogo abierto si navega a una ruta protegida
      if (event.url === '/admin' || event.url === '/usuario') {
        this.dialog.closeAll();
      }
    });
  }
  
  openLogin(email?: string) {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: 'auto',
      maxWidth: '95vw',
      minWidth: '320px',
      disableClose: false,
      autoFocus: false, // Cambiar a false para evitar focus automático que puede causar flash
      panelClass: 'login-dialog',
      enterAnimationDuration: '0ms', // SIN animación de entrada
      exitAnimationDuration: '200ms',
      hasBackdrop: true,
      data: { email: email }
    });

    // Manejar transición a registro
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'register') {
        // Pequeño delay para transición suave
        setTimeout(() => {
          this.openRegister();
        }, 100);
      }
    });
  }
  
  openRegister() {
    console.log('Abriendo modal de registro...');
    const dialogRef = this.dialog.open(RegisterComponent, {
      width: 'auto',
      maxWidth: '95vw',
      minWidth: '320px',
      disableClose: false,
      autoFocus: false, // Sin focus automático
      panelClass: 'register-dialog',
      enterAnimationDuration: '0ms', // SIN animación de entrada
      exitAnimationDuration: '200ms',
      hasBackdrop: true
    });

    // Manejar transición a login
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'login' || (result && result.action === 'login')) {
        // Pequeño delay para transición suave
        setTimeout(() => {
          this.openLogin(result?.email);
        }, 100);
      }
    });
  }
  
  isHomePage(): boolean {
    const url = this.router.url;
    return url === '/' || url === '';
  }
}

