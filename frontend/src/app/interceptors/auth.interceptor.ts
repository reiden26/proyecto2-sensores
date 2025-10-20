import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.startExpiryWatcher();
  }

  private expiryWatcherStarted = false;
  private isBrowser = true;

  private decodeJWT(token: string): any {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private isTokenExpired(payload: any): boolean {
    if (!payload || !payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }

  private startExpiryWatcher() {
    if (this.expiryWatcherStarted) return;
    this.expiryWatcherStarted = true;
    // Chequeo proactivo cada 5s
    setInterval(() => {
      try {
        if (!this.isBrowser) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const payload = this.decodeJWT(token);
        if (this.isTokenExpired(payload)) {
          // Limpiar y redirigir inmediatamente
          if (this.isBrowser) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_payload');
          }
          this.usuarioService.logout().subscribe({ complete: () => {} });
          if (this.router.url !== '/access-denied') {
            this.router.navigate(['/access-denied']);
          }
        }
      } catch {}
    }, 5000);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    // Clonar la request y añadir el header de autorización si existe el token
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Enviar la request y manejar errores
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // No interferir con el endpoint de logout
        if (req.url.includes('/logout')) {
          return throwError(() => error);
        }
        
        if (error.status === 401) {
          // Token inválido o expirado, limpiar y redirigir de inmediato
          if (this.isBrowser) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_payload');
          }
          this.usuarioService.logout().subscribe({ complete: () => {} });
          if (this.router.url !== '/access-denied') {
            this.router.navigate(['/access-denied']);
          }
        }
        
        if (error.status === 403) {
          console.error('Error 403 - Acceso denegado:', error.error);
        }
        return throwError(() => error);
      })
    );
  }
}










