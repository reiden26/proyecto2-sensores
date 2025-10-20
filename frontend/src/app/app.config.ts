import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getSpanishPaginatorIntl } from './i18n/material-es';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UsuarioService } from './services/usuario.service';
import { Router } from '@angular/router';

// Registrar locale español
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),   // ⬅️ aquí habilitas fetch
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'es' },  // Configurar español como idioma por defecto
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() },  // Traducción del paginador
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },  // Interceptor de autenticación
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [UsuarioService, Router],
      useFactory: (usuarioService: UsuarioService, router: Router) => () => {
        return new Promise<void>((resolve) => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              resolve();
              return;
            }
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            const now = Math.floor(Date.now() / 1000);
            if (!payload?.exp || payload.exp <= now) {
              localStorage.removeItem('token');
              localStorage.removeItem('user_payload');
              usuarioService.logout().subscribe({ complete: () => {} });
              router.navigate(['/access-denied']);
              resolve();
              return;
            }
            // Guardar payload por si lo usa la UI
            localStorage.setItem('user_payload', JSON.stringify(payload));
          } catch {}
          resolve();
        });
      }
    }
  ]
};
