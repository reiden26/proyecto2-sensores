import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  rol: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  imagen_url?: string;
}

export interface UsuarioUpdate {
  nombre?: string;
  email?: string;
  password?: string;
  imagen_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = environment.apiBaseUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    const token = localStorage.getItem('token');
    const userPayload = localStorage.getItem('user_payload');
    
    if (token && userPayload) {
      try {
        const payload = JSON.parse(userPayload);
        this.currentUserSubject.next(payload);
      } catch (error) {
        this.logout();
      }
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (!this.isBrowser) return;
          localStorage.setItem('token', response.access_token);
          try {
            const payload = JSON.parse(atob(response.access_token.split('.')[1]));
            localStorage.setItem('user_payload', JSON.stringify(payload));
            this.currentUserSubject.next(payload);
          } catch (error) {
            console.error('Error decodificando token:', error);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() });
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`, { headers: this.getHeaders() });
  }

  crearUsuario(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, userData, { headers: this.getHeaders() });
  }

  actualizarUsuario(id: number, userData: UsuarioUpdate): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, userData, { headers: this.getHeaders() });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { headers: this.getHeaders() });
  }

  logout(): Observable<any> {
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    console.log('Logout - Token disponible:', token ? 'Sí' : 'No');
    console.log('Logout - Token:', token ? token.substring(0, 50) + '...' : 'No token');
    
    const headers = this.getHeaders();
    console.log('Logout - Headers:', headers);
    
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        console.log('Logout exitoso en backend');
        if (this.isBrowser) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_payload');
        }
        this.currentUserSubject.next(null);
      }),
      catchError((error) => {
        console.error('Error en logout:', error);
        // Aunque falle el logout en el backend, limpiar el frontend
        if (this.isBrowser) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_payload');
        }
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.rol === 'admin';
  }

  isUsuario(): boolean {
    const user = this.getCurrentUser();
    return user && user.rol === 'usuario';
  }

  getSensorData(userId: number, timeFilter?: string): Observable<any> {
    let url = `${this.apiUrl}/lecturas/me`;
    // Usar limit en lugar de fecha_desde ya que el endpoint no lo soporta
    const limit = this.getLimitFromTimeFilter(timeFilter);
    if (limit) {
      url += `?limit=${limit}`;
    }
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  private getLimitFromTimeFilter(timeFilter?: string): number | null {
    if (!timeFilter) return 50; // Por defecto, obtener las últimas 50 lecturas
    
    const filters: { [key: string]: number } = {
      '1h': 60,    // 60 lecturas para 1 hora (1 por minuto)
      '6h': 360,   // 360 lecturas para 6 horas
      '24h': 1440, // 1440 lecturas para 24 horas
      '7d': 10080  // 10080 lecturas para 7 días
    };
    
    return filters[timeFilter] || 50;
  }

  // Sensores (admin)
  getSensores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sensores`, { headers: this.getHeaders() });
  }

  // Métodos para manejar sensores de usuarios
  obtenerSensoresUsuario(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/${usuarioId}/sensores`, { 
      headers: this.getHeaders() 
    });
  }

  asignarSensor(usuarioId: number, sensorId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios/${usuarioId}/sensores/${sensorId}`, {}, { 
      headers: this.getHeaders() 
    });
  }

  desasignarSensor(usuarioId: number, sensorId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/usuarios/${usuarioId}/sensores/${sensorId}`, { 
      headers: this.getHeaders() 
    });
  }

  // Método para obtener reportes de usuario con filtros
  getUserReports(queryParams: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reportes/me?${queryParams}`, { 
      headers: this.getHeaders() 
    });
  }

  // Método para cargar datos completos del usuario actual
  loadCurrentUser(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuario/actual`, { 
      headers: this.getHeaders() 
    }).pipe(
      tap(usuario => {
        this.currentUserSubject.next(usuario);
        // Guardar en localStorage para persistencia
        if (this.isBrowser) localStorage.setItem('user_payload', JSON.stringify(usuario));
      })
    );
  }

}








