import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  sensor: 'mq135' | 'mq7' | 'mq4';
  value: number;
  timestamp: Date;
  read: boolean;
  userId?: number;
  userName?: string;
}

export interface UserNotificationConfig {
  notifyMq135Good: boolean;
  notifyMq135Warning: boolean;
  notifyMq135Bad: boolean;
  notifyMq7Good: boolean;
  notifyMq7Warning: boolean;
  notifyMq7Bad: boolean;
  notifyMq4Good: boolean;
  notifyMq4Warning: boolean;
  notifyMq4Bad: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiBaseUrl;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private currentRole: 'admin' | 'usuario' = 'usuario';
  private currentUserId: number | null = null;
  private userConfig: UserNotificationConfig | null = null;
  private configLoadedForToken: string | null = null;
  private checkInterval: Subscription | null = null;
  private clearedNotificationIds = new Set<string>(); // IDs de notificaciones limpiadas
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadClearedNotifications();
    this.loadStoredNotifications();
  }

  

  // Cargar notificaciones almacenadas
  private loadStoredNotifications(): void {
    const key = this.getStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      const notifications = JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    }
  }

  // Cargar IDs de notificaciones limpiadas
  private loadClearedNotifications(): void {
    const stored = localStorage.getItem('clearedNotifications');
    if (stored) {
      const clearedIds = JSON.parse(stored);
      this.clearedNotificationIds = new Set(clearedIds);
    }
  }

  // Guardar IDs de notificaciones limpiadas
  private saveClearedNotifications(): void {
    localStorage.setItem('clearedNotifications', JSON.stringify(Array.from(this.clearedNotificationIds)));
  }

  // Guardar notificaciones en localStorage
  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(notifications));
  }

  // Iniciar monitoreo de notificaciones
  startMonitoring(userRole: 'admin' | 'usuario'): void {
    this.stopMonitoring(); // Detener monitoreo anterior si existe
    this.currentRole = userRole;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = Number(payload?.user_id ?? payload?.id ?? null);
        if (this.configLoadedForToken !== token) {
          this.loadUserConfig(token).then(() => {
            this.configLoadedForToken = token;
          }).catch(() => {});
        }
      }
    } catch { this.currentUserId = null; }
    this.loadStoredNotifications();
    
    // Verificar cada 5 segundos para notificaciones más responsivas
    this.checkInterval = interval(5000).subscribe(() => {
      this.checkForNewNotifications(userRole);
    });
    
    // Verificación inicial
    this.checkForNewNotifications(userRole);
  }

  // Detener monitoreo
  stopMonitoring(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
      this.checkInterval = null;
    }
  }

  // Limpiar estado al cerrar sesión
  clearAllState(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.clearedNotificationIds.clear();
    localStorage.removeItem('notifications');
    localStorage.removeItem('clearedNotifications');
    this.stopMonitoring();
  }

  // Verificar nuevas notificaciones
  private async checkForNewNotifications(userRole: 'admin' | 'usuario'): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      let notifications: any;
      
      try {
        if (userRole === 'admin') {
          // Para admin: obtener notificaciones de todos los usuarios
          notifications = await this.getAdminNotifications(token);
        } else {
          // Para usuario: obtener solo sus notificaciones
          notifications = await this.getUserNotifications(token);
        }

        if (notifications && notifications.length > 0) {
          this.processNotifications(notifications);
          return;
        }
      } catch (backendError) {
        console.log('Backend not available, using local data:', backendError);
      }

      // Si el backend no está disponible o no hay datos, no hacer nada
      // no-op
    } catch (error) {
      console.error('Error checking for notifications:', error);
      // No crear notificaciones aleatorias
    }
  }

  // Obtener notificaciones para admin (todos los usuarios)
  private async getAdminNotifications(token: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/notificaciones/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return null;
    }
  }

  // Obtener notificaciones para usuario (solo sus datos)
  private async getUserNotifications(token: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/notificaciones/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return null;
    }
  }

  // Procesar notificaciones del backend
  private processNotifications(notifications: any[]): void {
    // Aplicar configuración personal del usuario: si currentRole es 'usuario'
    // y el backend no filtró por configuración, filtramos aquí como salvaguarda.
    const mappedNotifications: Notification[] = notifications.map(n => ({
      id: String(n.id ?? n.notification_id ?? n.ID),
      title: n.titulo ?? n.title ?? 'Notificación',
      message: n.mensaje ?? n.message ?? '',
      type: (n.tipo ?? n.type ?? 'info') as 'info' | 'warning' | 'danger',
      sensor: (n.sensor_codigo ?? n.sensor ?? 'mq135') as 'mq135' | 'mq7' | 'mq4',
      value: Number(n.valor ?? n.value ?? 0),
      timestamp: new Date(n.creado_en ?? n.created_at ?? Date.now()),
      read: Boolean(n.leida ?? n.read ?? false),
      userId: Number(n.usuario_id ?? n.user_id ?? null),
      userName: n.usuario?.nombre || n.user_name || 'Usuario'
    }));

    // Filtrar notificaciones que han sido limpiadas por el usuario
    // Solo ocultar si el usuario la "limpió" Y sigue leída.
    // Aplicar configuración si existe para ambos roles
    const applyConfig = (n: Notification): boolean => {
      if (!this.userConfig) return true;
      const estado = this.mapEstadoToKey(n);
      if (!estado) return true;
      const key = `${n.sensor}_${estado}`; // e.g., mq135_good
      const map: any = {
        'mq135_good': this.userConfig.notifyMq135Good,
        'mq135_warning': this.userConfig.notifyMq135Warning,
        'mq135_bad': this.userConfig.notifyMq135Bad,
        'mq7_good': this.userConfig.notifyMq7Good,
        'mq7_warning': this.userConfig.notifyMq7Warning,
        'mq7_bad': this.userConfig.notifyMq7Bad,
        'mq4_good': this.userConfig.notifyMq4Good,
        'mq4_warning': this.userConfig.notifyMq4Warning,
        'mq4_bad': this.userConfig.notifyMq4Bad,
      };
      const allowed = map[key];
      return allowed !== false;
    };

    let filteredNotifications = mappedNotifications.filter(notification => {
      if (!applyConfig(notification)) return false;
      const wasCleared = this.clearedNotificationIds.has(notification.id);
      // Si ahora está no leída, asegurarnos de reponerla (y limpiar el cleared)
      if (wasCleared && !notification.read) {
        this.clearedNotificationIds.delete(notification.id);
        this.saveClearedNotifications();
        return true;
      }
      return !(wasCleared && notification.read);
    });

    // Filtro por rol/usuario: si es usuario, mostrar solo sus notificaciones
    if (this.currentRole === 'usuario' && this.currentUserId != null) {
      filteredNotifications = filteredNotifications.filter(n => n.userId === this.currentUserId);
    }

    this.notificationsSubject.next(filteredNotifications);
    this.saveNotifications(filteredNotifications);
    this.updateUnreadCount();
  }

  private async loadUserConfig(token: string): Promise<void> {
    try {
      const res = await this.http.get<any>(`${this.apiUrl}/configuracion-notificaciones/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).toPromise();
      this.userConfig = {
        notifyMq135Good: !!res?.notify_mq135_good,
        notifyMq135Warning: !!res?.notify_mq135_warning,
        notifyMq135Bad: !!res?.notify_mq135_bad,
        notifyMq7Good: !!res?.notify_mq7_good,
        notifyMq7Warning: !!res?.notify_mq7_warning,
        notifyMq7Bad: !!res?.notify_mq7_bad,
        notifyMq4Good: !!res?.notify_mq4_good,
        notifyMq4Warning: !!res?.notify_mq4_warning,
        notifyMq4Bad: !!res?.notify_mq4_bad,
      };
    } catch {
      this.userConfig = null;
    }
  }

  private mapEstadoToKey(n: Notification): 'good' | 'warning' | 'bad' | null {
    if (n.type === 'info') return 'good';
    if (n.type === 'warning') return 'warning';
    if (n.type === 'danger') return 'bad';
    return null;
  }

  private getStorageKey(): string {
    const role = this.currentRole || 'usuario';
    const uid = this.currentUserId != null ? String(this.currentUserId) : 'anon';
    return `notifications_${role}_${uid}`;
  }

  // Verificar datos reales de sensores (respaldo)
  private async checkForRealSensorData(userRole: 'admin' | 'usuario'): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      let sensorData: any;
      
      if (userRole === 'admin') {
        // Para admin: obtener datos de todos los usuarios
        sensorData = await this.getAdminSensorData(token);
      } else {
        // Para usuario: obtener solo sus datos
        sensorData = await this.getUserSensorData(token);
      }

      if (sensorData && sensorData.length > 0) {
        // Procesar datos reales de sensores
        // Aquí se procesarían los datos reales para crear notificaciones
      }
    } catch (error) {
      console.error('Error checking real sensor data:', error);
    }
  }

  // Obtener datos de sensores para admin (todos los usuarios)
  private async getAdminSensorData(token: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/lecturas/admin?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching admin sensor data:', error);
      return null;
    }
  }

  // Obtener datos de sensores para usuario (solo sus datos)
  private async getUserSensorData(token: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/lecturas/me?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching user sensor data:', error);
      return null;
    }
  }



  // Marcar notificación como leída
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await this.http.put(`${this.apiUrl}/notificaciones/${notificationId}/leer`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).toPromise();
        } catch (backendError) {
          console.log('Backend not available, updating locally:', backendError);
        }
      }

      // Actualizar estado local siempre
      const notifications = this.notificationsSubject.value;
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      this.notificationsSubject.next(updatedNotifications);
      this.saveNotifications(updatedNotifications);
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Marcar todas como leídas
  async markAllAsRead(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await this.http.put(`${this.apiUrl}/notificaciones/leer-todas`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).toPromise();
        } catch (backendError) {
          console.log('Backend not available, updating locally:', backendError);
        }
      }

      // Actualizar estado local siempre
      const notifications = this.notificationsSubject.value;
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      this.notificationsSubject.next(updatedNotifications);
      this.saveNotifications(updatedNotifications);
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Limpiar todas las notificaciones (ocultar las leídas del modal)
  async clearAllNotifications(): Promise<void> {
    try {
      // Obtener las notificaciones leídas actuales
      const currentNotifications = this.notificationsSubject.value;
      const readNotifications = currentNotifications.filter(notification => notification.read);
      
      // Agregar los IDs de las notificaciones leídas al conjunto de limpiadas
      readNotifications.forEach(notification => {
        this.clearedNotificationIds.add(notification.id);
      });
      
      // Guardar el estado de notificaciones limpiadas
      this.saveClearedNotifications();
      
      // Actualizar el estado local para mostrar solo las no leídas
      const unreadNotifications = currentNotifications.filter(notification => !notification.read);
      this.notificationsSubject.next(unreadNotifications);
      this.saveNotifications(unreadNotifications);
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  // Actualizar contador de no leídas
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.reduce((acc, n) => acc + (!n.read ? 1 : 0), 0);
    this.unreadCountSubject.next(unreadCount);
  }

  // Obtener notificaciones actuales
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  // Obtener contador de no leídas
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
