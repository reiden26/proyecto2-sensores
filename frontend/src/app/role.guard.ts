import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { UsuarioService } from './services/usuario.service';

function decodeJWT(token: string): any {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(payload: any): boolean {
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  const payload = decodeJWT(token || '');
  const requiredRole = route.data['role'];
  
  console.log('RoleGuard - Token:', token ? 'Presente' : 'Ausente');
  console.log('RoleGuard - Payload:', payload);
  console.log('RoleGuard - Rol requerido:', requiredRole);
  console.log('RoleGuard - Rol del usuario:', payload?.rol);
  
  // Si no hay token o payload inválido → access-denied
  if (!token || !payload) {
    console.log('RoleGuard - Sin token o payload inválido, redirigiendo a access-denied');
    router.navigate(['/access-denied']);
    return false;
  }
  
  // Si el token está expirado → access-denied
  if (isTokenExpired(payload)) {
    console.log('RoleGuard - Token expirado, limpiando y redirigiendo a access-denied');
    usuarioService.logout().subscribe();
    router.navigate(['/access-denied']);
    return false;
  }
  
  // Si no hay rol en el payload → access-denied (token malformado)
  if (!payload.rol) {
    console.log('RoleGuard - Sin rol en payload, redirigiendo a access-denied');
    usuarioService.logout().subscribe();
    router.navigate(['/access-denied']);
    return false;
  }
  
  // Si el rol no coincide con el requerido → access-denied
  if (payload.rol.toLowerCase() !== requiredRole?.toLowerCase()) {
    console.log(`RoleGuard - Rol no autorizado: ${payload.rol} vs ${requiredRole}, redirigiendo a access-denied`);
    console.log('RoleGuard - URL actual:', router.url);
    console.log('RoleGuard - Ruta destino:', '/access-denied');
    router.navigate(['/access-denied']).then(success => {
      console.log('RoleGuard - Navegación a access-denied:', success ? 'exitosa' : 'fallida');
    });
    return false;
  }
  
  console.log('RoleGuard - Acceso autorizado');
  return true;
};
