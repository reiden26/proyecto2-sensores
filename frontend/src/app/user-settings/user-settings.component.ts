import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from '../shared/notification/notification.service';
import { isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfirmSaveConfigDialogComponent } from './confirm-save-config-dialog.component';
import { ImageEditModalComponent } from './image-edit-modal.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule
  ],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  nombre: string = '';
  passwordActual: string = '';
  passwordNueva: string = '';
  passwordConfirmar: string = '';
  email: string = '';
  usuario: any = null;
  rol: string = '';
  userId: number | null = null;
  isLoading: boolean = false;
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  
  showConfirmPassword: boolean = false;
  isEditingName: boolean = false;
  passwordError: string = '';
  personalError: string = '';
  personalSuccess: string = '';
  originalNombre: string = '';
  // Usuario: prolongar sesión individual
  userExtendSession: boolean = false;
  
  // User notification configuration
  userSystemConfig = {
    // MQ-135 (Calidad del aire / CO₂ aprox.)
    notifyMq135Good: true,
    notifyMq135Warning: true,
    notifyMq135Bad: true,
    // MQ-7 (Monóxido de carbono)
    notifyMq7Good: true,
    notifyMq7Warning: true,
    notifyMq7Bad: true,
    // MQ-4 (Metano / gas natural)
    notifyMq4Good: true,
    notifyMq4Warning: true,
    notifyMq4Bad: true
  };

  // Admin configuration properties
  systemConfig = {
    alertThreshold: 50,
    // MQ-135 (Calidad del aire / CO₂ aprox.)
    notifyMq135Good: true,
    notifyMq135Warning: true,
    notifyMq135Bad: true,
    // MQ-7 (Monóxido de carbono)
    notifyMq7Good: true,
    notifyMq7Warning: true,
    notifyMq7Bad: true,
    // MQ-4 (Metano / gas natural)
    notifyMq4Good: true,
    notifyMq4Warning: true,
    notifyMq4Bad: true
  };
  
  notificationConfig = {
    emailAlerts: true,
    realTimeAlerts: true,
    autoReports: false,
    systemAlerts: true
  };
  
  securityConfig = {
    autoSession: false
  };
  
  private isBrowser: boolean;

  // Admin: gestión de configuración de usuarios
  usuariosRolUsuario: Array<{id:number; nombre:string}> = [];
  selectedUserId: number | null = null;
  selectedUserConfig = {
    notifyMq135Good: false,
    notifyMq135Warning: true,
    notifyMq135Bad: true,
    notifyMq7Good: false,
    notifyMq7Warning: true,
    notifyMq7Bad: true,
    notifyMq4Good: false,
    notifyMq4Warning: true,
    notifyMq4Bad: true
  };
  selectedUserExtendSession: boolean = false;

  // Admin: tabla de usuarios para prolongar sesión masivo
  usuariosSesionRows: Array<any> = [];
  usuariosSesionFiltered: Array<any> = [];
  usuariosSesionFilter = { text: '', rol: '', activa: '', prolongar: '' };
  @ViewChild(MatPaginator) usuariosSesionPaginator!: MatPaginator;
  showUsuariosSesion: boolean = false;
  isLoadingUsuariosSesion: boolean = false;

  private extendSessionHandler?: any;
  private storageHandler?: any;
  private pollUserInterval?: any;
  private pollAdminUsersInterval?: any;
  // Admin: Configuración de alertas (solo umbrales)
  alertsConfig: any = {
    // MQ-135
    mq135_warning_threshold: 400,
    mq135_bad_threshold: 1000,
    // MQ-4
    mq4_warning_threshold: 1000,
    mq4_bad_threshold: 5000,
    // MQ-7
    mq7_warning_threshold: 9,
    mq7_bad_threshold: 35,
  };
  isSavingAlerts: boolean = false;
  isEditingAlerts: boolean = false;
  private alertsConfigOriginal: any = null;

  constructor(
    private notifications: NotificationService, 
    private http: HttpClient,
    private dialog: MatDialog,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.nombre = payload.nombre || '';
          this.originalNombre = this.nombre; // Guardar nombre original
          this.email = payload.sub || '';
          this.rol = payload.rol || '';
          this.userId = Number(payload.user_id);
          
          // Cargar datos completos del usuario
          this.cargarDatosUsuario();
        this.obtenerUsuarioCompleto();
          
          // Cargar configuración de notificaciones desde el backend
          this.loadNotificationConfigFromBackend();

          // Solo admin: cargar configuración global del sistema y vistas administrativas
          if ((this.rol || '').toLowerCase() === 'admin') {
            this.loadSystemSecurityConfig();
            this.cargarUsuariosRolUsuario();
            this.cargarUsuariosSesionTabla();
            this.loadAlertsConfig();
          }
          // Cargar prolongación individual del usuario
          this.loadUserExtendSession();
        }
      } catch (error) {
      }

      // Escuchar sincronización de prolongación de sesión en tiempo real
      try {
        // BroadcastChannel para sincronización entre pestañas (si está disponible)
        if (typeof (window as any).BroadcastChannel !== 'undefined') {
          const BC: any = (window as any).BroadcastChannel;
          (this as any).bc = new BC('extend-session-channel');
          (this as any).bc.onmessage = (msg: any) => {
            const payload = msg?.data;
            if (payload && typeof payload.userId === 'number') {
              document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: payload }));
            }
          };
        }
        this.extendSessionHandler = (e: any) => {
          const detail = e?.detail || {};
          if (typeof detail?.userId === 'number') {
            this.zone.run(() => {
              if (this.userId && detail.userId === this.userId) {
              this.userExtendSession = !!detail.value;
              }
              if ((this.rol || '').toLowerCase() === 'admin') {
                if (this.selectedUserId && detail.userId === this.selectedUserId) {
                  this.selectedUserExtendSession = !!detail.value;
                }
                const row = this.usuariosSesionRows.find((r: any) => r.id === detail.userId);
                if (row) {
                  row.prolongar_sesion = !!detail.value;
                  this.aplicarFiltroUsuariosSesion();
                }
              }
              this.cdr.detectChanges();
            });
          }
        };
        document.addEventListener('extendSessionUpdated', this.extendSessionHandler as any);
        // Escuchar eventos de otras pestañas/ventanas mediante localStorage
        this.storageHandler = (se: StorageEvent) => {
          if (se.key === 'extendSessionUpdated' && se.newValue) {
            try {
              const payload = JSON.parse(se.newValue);
              if (payload && typeof payload.userId === 'number') {
                // Reusar la misma ruta de actualización
                document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: payload }));
              }
            } catch {}
          }
        };
        window.addEventListener('storage', this.storageHandler);
      } catch {}
      // Iniciar polling periódico para sincronizar desde BD
      this.startPolling();
    }
  }

  // --- Admin: cargar configuración de alertas (global del sistema) ---
  loadAlertsConfig(): void {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      this.http.get<any>(`${environment.apiBaseUrl}/configuracion-sistema`, { headers }).subscribe({
        next: (cfg) => {
          if (!cfg) return;
          const assign = (k: string, d: any) => { if (cfg[k] !== undefined && cfg[k] !== null) this.alertsConfig[k] = cfg[k]; else this.alertsConfig[k] = d; };
          // MQ-135
          assign('mq135_warning_threshold', 400);
          assign('mq135_bad_threshold', 1000);
          assign('mq135_trigger_valor', null);
          assign('mq135_trigger_tipo', 'igual');
          // limpiar flags viejos y volumen
          // MQ-4
          assign('mq4_warning_threshold', 1000);
          assign('mq4_bad_threshold', 5000);
          assign('mq4_trigger_valor', null);
          assign('mq4_trigger_tipo', 'igual');
          // limpiar flags viejos y volumen
          // MQ-7
          assign('mq7_warning_threshold', 9);
          assign('mq7_bad_threshold', 35);
          assign('mq7_trigger_valor', null);
          assign('mq7_trigger_tipo', 'igual');
          // limpiar flags viejos y volumen
          this.alertsConfigOriginal = { ...this.alertsConfig };
          this.cdr.detectChanges();
        }
      });
    } catch {}
  }

  // --- Admin: guardar configuración de alertas ---
  saveAlertsConfig(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const payload: any = { ...this.alertsConfig };
    this.isSavingAlerts = true;
    this.http.put<any>(`${environment.apiBaseUrl}/configuracion-sistema`, payload, { headers }).subscribe({
      next: () => {
        this.isSavingAlerts = false;
        this.notifications.showUserSuccess('Configuración de alertas actualizada');
        this.isEditingAlerts = false;
        this.alertsConfigOriginal = { ...this.alertsConfig };
      },
      error: () => { this.isSavingAlerts = false; this.notifications.showUserError('guardar configuración de alertas', 'No se pudo guardar'); }
    });
  }

  // --- Admin: edición de configuración de alertas ---
  startEditAlerts(): void {
    this.isEditingAlerts = true;
    if (!this.alertsConfigOriginal) this.alertsConfigOriginal = { ...this.alertsConfig };
  }

  cancelEditAlerts(): void {
    this.isEditingAlerts = false;
    if (this.alertsConfigOriginal) {
      this.alertsConfig = { ...this.alertsConfigOriginal };
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    try { if (this.extendSessionHandler) document.removeEventListener('extendSessionUpdated', this.extendSessionHandler); } catch {}
    try { if (this.storageHandler) window.removeEventListener('storage', this.storageHandler); } catch {}
    this.stopPolling();
  }

  // Admin: cargar filas de la tabla de usuarios-sesión
  cargarUsuariosSesionTabla(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.isLoadingUsuariosSesion = true;
    this.http.get<any[]>(`${environment.apiBaseUrl}/admin/usuarios-sesion`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (rows) => { this.usuariosSesionRows = rows || []; this.aplicarFiltroUsuariosSesion(); this.isLoadingUsuariosSesion = false; },
      error: () => { this.isLoadingUsuariosSesion = false; }
    });
  }

  aplicarFiltroUsuariosSesion(): void {
    const t = (this.usuariosSesionFilter.text || '').toLowerCase();
    this.usuariosSesionFiltered = this.usuariosSesionRows.filter(r =>
      (!t || r.nombre.toLowerCase().includes(t) || r.email.toLowerCase().includes(t)) &&
      (!this.usuariosSesionFilter.rol || r.rol === this.usuariosSesionFilter.rol) &&
      (this.usuariosSesionFilter.activa === '' || r.sesion_activa === (this.usuariosSesionFilter.activa === 'true')) &&
      (this.usuariosSesionFilter.prolongar === '' || r.prolongar_sesion === (this.usuariosSesionFilter.prolongar === 'true'))
    );
  }

  toggleUsuariosSesion(): void {
    this.showUsuariosSesion = !this.showUsuariosSesion;
    if (this.showUsuariosSesion && this.usuariosSesionRows.length === 0) {
      this.cargarUsuariosSesionTabla();
    }
    // Activar o desactivar polling de admin según visibilidad
    if (this.showUsuariosSesion) {
      this.ensureAdminPolling();
    }
  }

  // Admin: actualizar prolongar sesión inline con confirmación
  actualizarProlongacionUsuarioInline(row: any, event: any): void {
    const nuevoValor = !!event.checked;
    const anterior = !!row.prolongar_sesion;
    // Revertir visualmente de inmediato hasta confirmar
    try { event.source.checked = anterior; } catch {}
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      panelClass: 'admin-confirm-dialog',
      data: {
        title: nuevoValor ? 'Prolongar sesión a 60 min' : 'Restablecer a 30 min',
        message: `Se ${nuevoValor ? 'prolongará' : 'restablecerá'} la sesión de ${row.nombre}. ¿Deseas continuar?`,
        icon: nuevoValor ? 'schedule' : 'restore'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { this.cdr.detectChanges(); return; }
      const token = localStorage.getItem('token');
      if (!token) return;
      this.http.put(`${environment.apiBaseUrl}/admin/configuracion-sesion/${row.id}`, {
        prolongar_sesion: !!nuevoValor
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      }).subscribe({
        next: () => { 
          row.prolongar_sesion = nuevoValor;
          try { event.source.checked = nuevoValor; } catch {}
          try { document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: { userId: row.id, value: !!row.prolongar_sesion } })); } catch {}
          try { localStorage.setItem('extendSessionUpdated', JSON.stringify({ userId: row.id, value: !!row.prolongar_sesion, ts: Date.now() })); } catch {}
          try { ((this as any).bc)?.postMessage({ userId: row.id, value: !!row.prolongar_sesion }); } catch {}
          this.notifications.showSuccess('Éxito', 'Preferencia actualizada'); 
          this.cdr.detectChanges();
        },
        error: () => { this.notifications.showError('Error', 'No se pudo actualizar'); this.cdr.detectChanges(); }
      });
    });
  }

  cargarDatosUsuario(): void {
    if (!this.isBrowser) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Obtener el ID del usuario desde el token
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = Number(payload.user_id);
      
      if (!this.userId) {
        this.notifications.showError('Error', 'No se pudo identificar al usuario');
        return;
      }

      // Obtener datos del usuario usando el endpoint correcto
      this.http.get(`http://localhost:8000/usuarios/${this.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).subscribe({
        next: (usuario: any) => {
          this.nombre = usuario.nombre;
          this.email = usuario.email;
          this.rol = usuario.rol;
          this.usuario = usuario;
        },
        error: (error) => {
          this.notifications.showError('Error', 'No se pudieron cargar los datos del usuario');
        }
      });
    } catch (error) {
      this.notifications.showError('Error', 'Token inválido');
    }
  }

  // Admin: cargar usuarios con rol usuario
  cargarUsuariosRolUsuario(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.http.get<any[]>(`${environment.apiBaseUrl}/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (users) => {
        this.usuariosRolUsuario = (users || []).filter(u => (u.rol || '').toLowerCase() === 'usuario');
      },
      error: () => {}
    });
  }

  onSelectUserForConfig(): void { /* ya no recarga automáticamente */ }

  reloadSelectedUserConfig(): void { /* eliminado por no ser necesario */ }

  saveSelectedUserConfig(): void {
    const token = localStorage.getItem('token');
    if (!token || !this.selectedUserId) return;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      data: {
        title: 'Guardar configuración',
        message: 'Se guardará la configuración de notificaciones para este usuario. ¿Deseas continuar?'
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) { return; }
      this.isLoading = true;
      const body = {
        notify_mq135_good: this.selectedUserConfig.notifyMq135Good,
        notify_mq135_warning: this.selectedUserConfig.notifyMq135Warning,
        notify_mq135_bad: this.selectedUserConfig.notifyMq135Bad,
        notify_mq7_good: this.selectedUserConfig.notifyMq7Good,
        notify_mq7_warning: this.selectedUserConfig.notifyMq7Warning,
        notify_mq7_bad: this.selectedUserConfig.notifyMq7Bad,
        notify_mq4_good: this.selectedUserConfig.notifyMq4Good,
        notify_mq4_warning: this.selectedUserConfig.notifyMq4Warning,
        notify_mq4_bad: this.selectedUserConfig.notifyMq4Bad
      };
      this.http.put<any>(`${environment.apiBaseUrl}/admin/configuracion-notificaciones/${this.selectedUserId}`, body, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).subscribe({
        next: () => {
          // Guardar también la prolongación de sesión del usuario seleccionado
          this.http.put(`${environment.apiBaseUrl}/admin/configuracion-sesion/${this.selectedUserId}`, {
            prolongar_sesion: !!this.selectedUserExtendSession
          }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }).subscribe({
            next: () => { 
              this.isLoading = false; 
              try { document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: { userId: this.selectedUserId, value: !!this.selectedUserExtendSession } })); } catch {}
              try { localStorage.setItem('extendSessionUpdated', JSON.stringify({ userId: this.selectedUserId, value: !!this.selectedUserExtendSession, ts: Date.now() })); } catch {}
              try { ((this as any).bc)?.postMessage({ userId: this.selectedUserId, value: !!this.selectedUserExtendSession }); } catch {}
              this.notifications.showSuccess('Éxito', 'Configuración de usuario guardada'); 
            },
            error: () => { this.isLoading = false; this.notifications.showError('Error', 'No se pudo guardar prolongación de sesión'); }
          });
        },
        error: () => {
          this.isLoading = false;
          this.notifications.showError('Error', 'No se pudo guardar la configuración del usuario');
        }
      });
    });
  }

  // Admin: manejar cambio del toggle del usuario seleccionado con confirmación
  onChangeSelectedUserExtend(event: any): void {
    if (!this.selectedUserId) { return; }
    const propuesto = !!event.checked;
    // Restaurar visualmente hasta confirmar
    this.selectedUserExtendSession = !propuesto;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      panelClass: 'admin-confirm-dialog',
      data: {
        title: propuesto ? 'Prolongar sesión a 60 min' : 'Restablecer a 30 min',
        message: `Se ${propuesto ? 'prolongará' : 'restablecerá'} la sesión del usuario seleccionado. ¿Deseas continuar?`,
        icon: propuesto ? 'schedule' : 'restore'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { this.cdr.detectChanges(); return; }
      const token = localStorage.getItem('token');
      if (!token) { return; }
      this.http.put(`${environment.apiBaseUrl}/admin/configuracion-sesion/${this.selectedUserId}`, {
        prolongar_sesion: !!propuesto
      }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }).subscribe({
        next: () => {
          this.selectedUserExtendSession = propuesto;
          try { document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: { userId: this.selectedUserId, value: !!propuesto } })); } catch {}
          try { localStorage.setItem('extendSessionUpdated', JSON.stringify({ userId: this.selectedUserId, value: !!propuesto, ts: Date.now() })); } catch {}
          try { ((this as any).bc)?.postMessage({ userId: this.selectedUserId, value: !!propuesto }); } catch {}
          this.notifications.showSuccess('Éxito', 'Preferencia actualizada');
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications.showError('Error', 'No se pudo actualizar');
          this.cdr.detectChanges();
        }
      });
    });
  }

  guardarCambios() {
    
    if (!this.userId) {
      this.notifications.showError('Error', 'No se pudo identificar al usuario');
      return;
    }

    if (!this.nombre.trim() && !this.passwordNueva) {
      this.notifications.showInfo('Sin cambios', 'No hay cambios para guardar');
      return;
    }

    // Validar contraseña actual si se está cambiando la contraseña
    if (this.passwordNueva || this.passwordConfirmar) {
      if (!this.passwordActual.trim()) {
        this.notifications.showWarning('Contraseña actual requerida', 'Debes ingresar tu contraseña actual para cambiarla');
        return;
      }
      if (this.passwordNueva !== this.passwordConfirmar) {
        this.notifications.showWarning('Contraseñas no coinciden', 'Verifica la nueva contraseña');
        return;
      }
      if (this.passwordNueva.length < 3) {
        this.notifications.showWarning('Contraseña muy corta', 'La contraseña debe tener al menos 3 caracteres');
        return;
      }
    }

    this.isLoading = true;

    // Preparar datos para enviar
    const updateData: any = {};
    if (this.nombre.trim()) {
      updateData.nombre = this.nombre.trim();
    }
    if (this.passwordNueva) {
      updateData.password = this.passwordNueva;
      updateData.password_actual = this.passwordActual;
    }


    // Obtener token para autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      this.notifications.showError('Error', 'No estás autenticado');
      this.isLoading = false;
      return;
    }


    // Llamar a la API para actualizar
    this.http.put(`http://localhost:8000/usuarios/${this.userId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.notifications.showSuccess('Configuración guardada', 'Tus datos se han actualizado correctamente');
        
        // Limpiar campos de contraseña
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordConfirmar = '';
        
        // Actualizar el token en localStorage con el nuevo nombre
        this.actualizarTokenLocal();
      },
      error: (error) => {
        this.isLoading = false;
        this.notifications.showError('Error', error.error?.detail || 'Error al actualizar los datos');
      }
    });
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleNameEditing(): void {
    this.isEditingName = !this.isEditingName;
  }

  getTipoCuenta(): string {
    return this.rol === 'admin' ? 'Administración' : 'Usuario';
  }

  // Admin configuration methods
  obtenerDatosUsuario(): void {
    // Método para obtener datos del usuario
    // Este método ya existe en el componente, solo se está llamando
  }


  // Cargar configuraciones desde localStorage
  loadConfigurations(): void {
    if (!this.isBrowser) return;
    
    try {
      // Cargar configuraciones de admin
      const systemConfig = localStorage.getItem('admin_system_config');
      if (systemConfig) {
        this.systemConfig = { ...this.systemConfig, ...JSON.parse(systemConfig) };
      }

      const notificationConfig = localStorage.getItem('admin_notification_config');
      if (notificationConfig) {
        this.notificationConfig = { ...this.notificationConfig, ...JSON.parse(notificationConfig) };
      }

      const securityConfig = localStorage.getItem('admin_security_config');
      if (securityConfig) {
        this.securityConfig = { ...this.securityConfig, ...JSON.parse(securityConfig) };
      }

      // Cargar configuraciones de usuario
      const userNotificationConfig = localStorage.getItem('user_notification_config');
      if (userNotificationConfig) {
        this.userSystemConfig = { ...this.userSystemConfig, ...JSON.parse(userNotificationConfig) };
      }
    } catch (error) {
    }
  }

  // Guardar configuraciones en localStorage
  saveSystemConfig(): void {
    this.isLoading = true;
    
    if (this.isBrowser) {
      try {
        localStorage.setItem('admin_system_config', JSON.stringify(this.systemConfig));
      } catch (error) {
      }
    }
    
    setTimeout(() => {
      this.isLoading = false;
      this.notifications.showSuccess('Éxito', 'Configuración del sistema guardada correctamente');
    }, 1000);
  }

  saveNotificationConfig(): void {
    this.isLoading = true;
    
    if (this.isBrowser) {
      try {
        localStorage.setItem('admin_notification_config', JSON.stringify(this.notificationConfig));
      } catch (error) {
      }
    }
    
    setTimeout(() => {
      this.isLoading = false;
      this.notifications.showSuccess('Éxito', 'Configuración de notificaciones guardada correctamente');
    }, 1000);
  }

  saveSecurityConfig(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
    // Guardar configuración global (prolongar_sesion)
    this.http.put(`${environment.apiBaseUrl}/configuracion-sistema`, {
      prolongar_sesion: !!this.securityConfig.autoSession
    }, { headers }).subscribe({
      next: () => {
        this.isLoading = false;
        this.notifications.showSuccess('Éxito', 'Configuración de seguridad guardada');
      },
      error: () => {
        this.isLoading = false;
        this.notifications.showError('Error', 'No se pudo guardar la configuración de seguridad');
      }
    });
  }

  // Usuario: confirmar sin cambiar visualmente hasta aceptar
  onConfirmUserExtend(event: any): void {
    const previo = !event.checked;
    // Revertir inmediatamente el estado visual y el modelo
    try { event.source.checked = previo; } catch {}
    this.userExtendSession = previo;
    const propuesto = !previo;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      data: {
        title: propuesto ? 'Prolongar sesión a 60 min' : 'Restablecer a 30 min',
        message: `Se ${propuesto ? 'prolongará' : 'restablecerá'} tu sesión. ¿Deseas continuar?`,
        icon: propuesto ? 'schedule' : 'restore'
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        try { event.source.checked = propuesto; } catch {}
        this.userExtendSession = propuesto;
        this.saveUserExtendSession();
      }
      this.cdr.detectChanges();
    });
  }

  // Admin: confirmar sin cambiar visual para usuario seleccionado
  onConfirmSelectedUserExtend(event: any): void {
    if (!this.selectedUserId) { return; }
    const previo = !event.checked;
    try { event.source.checked = previo; } catch {}
    this.selectedUserExtendSession = previo;
    const propuesto = !previo;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      panelClass: 'admin-confirm-dialog',
      data: {
        title: propuesto ? 'Prolongar sesión a 60 min' : 'Restablecer a 30 min',
        message: `Se ${propuesto ? 'prolongará' : 'restablecerá'} la sesión del usuario seleccionado. ¿Deseas continuar?`
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) { this.cdr.detectChanges(); return; }
      const token = localStorage.getItem('token');
      if (!token) { return; }
      this.http.put(`${environment.apiBaseUrl}/admin/configuracion-sesion/${this.selectedUserId}`, {
        prolongar_sesion: !!propuesto
      }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }).subscribe({
        next: () => {
          try { event.source.checked = propuesto; } catch {}
          this.selectedUserExtendSession = propuesto;
          try { document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: { userId: this.selectedUserId, value: !!propuesto } })); } catch {}
          try { localStorage.setItem('extendSessionUpdated', JSON.stringify({ userId: this.selectedUserId, value: !!propuesto, ts: Date.now() })); } catch {}
          try { ((this as any).bc)?.postMessage({ userId: this.selectedUserId, value: !!propuesto }); } catch {}
          this.notifications.showSuccess('Éxito', 'Preferencia actualizada');
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications.showError('Error', 'No se pudo actualizar');
          this.cdr.detectChanges();
        }
      });
    });
  }

  // Admin global: confirmar sin cambiar visual
  onConfirmAdminGlobalExtend(event: any): void {
    const previo = !event.checked;
    try { event.source.checked = previo; } catch {}
    this.securityConfig.autoSession = previo;
    const propuesto = !previo;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      panelClass: 'admin-confirm-dialog',
      data: {
        title: propuesto ? 'Prolongar a 60 min' : 'Restablecer a 30 min',
        message: `Se ${propuesto ? 'prolongarán' : 'restablecerán'} las sesiones según la configuración global. ¿Deseas continuar?`,
        icon: propuesto ? 'schedule' : 'restore'
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) { this.cdr.detectChanges(); return; }
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      });
      this.http.put(`${environment.apiBaseUrl}/configuracion-sistema`, {
        prolongar_sesion: !!propuesto
      }, { headers }).subscribe({
        next: () => {
          try { event.source.checked = propuesto; } catch {}
          this.securityConfig.autoSession = propuesto;
          try { localStorage.setItem('extendSessionGlobalUpdated', JSON.stringify({ value: !!this.securityConfig.autoSession, ts: Date.now() })); } catch {}
          this.notifications.showSuccess('Éxito', 'Configuración global actualizada');
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications.showError('Error', 'No se pudo actualizar la configuración global');
          this.cdr.detectChanges();
        }
      });
    });
  }

  // Admin global: manejar cambio con confirmación
  onChangeAdminGlobalExtend(event: any): void {
    const propuesto = !!event.checked;
    // Restaurar visualmente hasta confirmar
    this.securityConfig.autoSession = !propuesto;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      panelClass: 'admin-confirm-dialog',
      data: {
        title: propuesto ? 'Prolongar a 60 min' : 'Restablecer a 30 min',
        message: `Se ${propuesto ? 'prolongarán' : 'restablecerán'} las sesiones según la configuración global. ¿Deseas continuar?`
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { this.cdr.detectChanges(); return; }
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      });
      this.http.put(`${environment.apiBaseUrl}/configuracion-sistema`, {
        prolongar_sesion: !!propuesto
      }, { headers }).subscribe({
        next: () => {
          this.securityConfig.autoSession = propuesto;
          try { localStorage.setItem('extendSessionGlobalUpdated', JSON.stringify({ value: !!this.securityConfig.autoSession, ts: Date.now() })); } catch {}
          this.notifications.showSuccess('Éxito', 'Configuración global actualizada');
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications.showError('Error', 'No se pudo actualizar la configuración global');
          this.cdr.detectChanges();
        }
      });
    });
  }

  // Cargar configuración global (prolongar_sesion) para sincronizar toggles
  loadSystemSecurityConfig(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    this.http.get<any>(`${environment.apiBaseUrl}/configuracion-sistema`, { headers }).subscribe({
      next: (cfg) => {
        if (cfg) {
          this.securityConfig.autoSession = !!cfg.prolongar_sesion;
        }
      },
      error: () => {}
    });
  }

  // Usuario: cargar su propia preferencia de prolongar sesión
  loadUserExtendSession(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    this.http.get<any>(`${environment.apiBaseUrl}/configuracion-sesion/me`, { headers }).subscribe({
      next: (cfg) => { this.userExtendSession = !!cfg?.prolongar_sesion; },
      error: () => {}
    });
  }

  // Usuario: guardar preferencia de prolongar sesión
  saveUserExtendSession(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
    this.http.put(`${environment.apiBaseUrl}/configuracion-sesion/me`, {
      prolongar_sesion: !!this.userExtendSession
    }, { headers }).subscribe({
      next: () => { 
        this.isLoading = false; 
        try { document.dispatchEvent(new CustomEvent('extendSessionUpdated', { detail: { userId: this.userId, value: !!this.userExtendSession } })); } catch {}
        try { localStorage.setItem('extendSessionUpdated', JSON.stringify({ userId: this.userId, value: !!this.userExtendSession, ts: Date.now() })); } catch {}
        try { ((this as any).bc)?.postMessage({ userId: this.userId, value: !!this.userExtendSession }); } catch {}
        this.notifications.showSuccess('Éxito', 'Preferencia guardada'); 
      },
      error: () => { this.isLoading = false; this.notifications.showError('Error', 'No se pudo guardar'); }
    });
  }

  // Usuario: manejar cambio con confirmación (sin cambiar visual hasta confirmar)
  onChangeUserExtend(event: any): void {
    const propuesto = !!event.checked;
    // Restaurar visualmente hasta confirmar
    this.userExtendSession = !propuesto;
    const ref = this.dialog.open(ConfirmSaveConfigDialogComponent, {
      data: {
        title: propuesto ? 'Prolongar sesión a 60 min' : 'Restablecer a 30 min',
        message: `Se ${propuesto ? 'prolongará' : 'restablecerá'} tu sesión. ¿Deseas continuar?`
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.userExtendSession = propuesto;
        this.saveUserExtendSession();
      }
      this.cdr.detectChanges();
    });
  }

  // --- Polling helpers ---
  private startPolling(): void {
    // Usuario actual: sincronizar su propio toggle cada 5s
    try {
      if (!this.pollUserInterval) {
        this.pollUserInterval = setInterval(() => {
          this.pollUserExtendSession();
        }, 5000);
      }
    } catch {}
    // Admin: solo si está en rol admin, activaremos polling de la tabla cuando sea visible
    this.ensureAdminPolling();
  }

  private stopPolling(): void {
    try { if (this.pollUserInterval) { clearInterval(this.pollUserInterval); this.pollUserInterval = undefined; } } catch {}
    try { if (this.pollAdminUsersInterval) { clearInterval(this.pollAdminUsersInterval); this.pollAdminUsersInterval = undefined; } } catch {}
  }

  private ensureAdminPolling(): void {
    const isAdmin = (this.rol || '').toLowerCase() === 'admin';
    if (!isAdmin) return;
    // Si la sección está visible, iniciar/continuar polling; si no, detenerlo
    if (this.showUsuariosSesion) {
      if (!this.pollAdminUsersInterval) {
        this.pollAdminUsersInterval = setInterval(() => {
          this.zone.run(() => {
            this.cargarUsuariosSesionTabla();
            // Si hay un usuario seleccionado, sincronizar su toggle desde la tabla
            if (this.selectedUserId) {
              const row = this.usuariosSesionRows.find(r => r.id === this.selectedUserId);
              if (row) {
                const newVal = !!row.prolongar_sesion;
                if (this.selectedUserExtendSession !== newVal) {
                  this.selectedUserExtendSession = newVal;
                }
              }
            }
            this.cdr.detectChanges();
          });
        }, 5000);
      }
    } else {
      try { if (this.pollAdminUsersInterval) { clearInterval(this.pollAdminUsersInterval); this.pollAdminUsersInterval = undefined; } } catch {}
    }
  }

  private pollUserExtendSession(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${environment.apiBaseUrl}/configuracion-sesion/me`, { headers }).subscribe({
      next: (cfg) => {
        const incoming = !!cfg?.prolongar_sesion;
        if (this.userExtendSession !== incoming) {
          this.zone.run(() => {
            this.userExtendSession = incoming;
            this.cdr.detectChanges();
          });
        }
      },
      error: () => {}
    });
  }

  // Personal and Security Settings Methods

  savePassword(): void {
    if (!this.passwordActual || !this.passwordNueva || !this.passwordConfirmar) {
      this.notifications.showError('Error', 'Todos los campos de contraseña son obligatorios');
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.notifications.showError('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (this.passwordNueva.length < 3) {
      this.notifications.showError('Error', 'La nueva contraseña debe tener al menos 3 caracteres');
      return;
    }

    this.isLoading = true;
    
    // Simular cambio de contraseña
    setTimeout(() => {
      this.isLoading = false;
      this.passwordActual = '';
      this.passwordNueva = '';
      this.passwordConfirmar = '';
      this.notifications.showSuccess('Éxito', 'Contraseña cambiada correctamente');
    }, 1500);
  }

  // Cargar configuración de notificaciones desde el backend
  async loadNotificationConfigFromBackend(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/configuracion-notificaciones/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const config = await response.json();
        // Actualizar la configuración local con los datos del backend
        this.userSystemConfig = {
          notifyMq135Good: config.notify_mq135_good,
          notifyMq135Warning: config.notify_mq135_warning,
          notifyMq135Bad: config.notify_mq135_bad,
          notifyMq7Good: config.notify_mq7_good,
          notifyMq7Warning: config.notify_mq7_warning,
          notifyMq7Bad: config.notify_mq7_bad,
          notifyMq4Good: config.notify_mq4_good,
          notifyMq4Warning: config.notify_mq4_warning,
          notifyMq4Bad: config.notify_mq4_bad
        };
        
        // También guardar en localStorage como respaldo
        localStorage.setItem('user_notification_config', JSON.stringify(this.userSystemConfig));
      }
    } catch (error) {
    }
  }

  // User notification methods
  async saveUserNotifications(): Promise<void> {
    this.isLoading = true;
    
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Guardar en el backend (convertir nombres de campos)
        const configToSave = {
          notify_mq135_good: this.userSystemConfig.notifyMq135Good,
          notify_mq135_warning: this.userSystemConfig.notifyMq135Warning,
          notify_mq135_bad: this.userSystemConfig.notifyMq135Bad,
          notify_mq7_good: this.userSystemConfig.notifyMq7Good,
          notify_mq7_warning: this.userSystemConfig.notifyMq7Warning,
          notify_mq7_bad: this.userSystemConfig.notifyMq7Bad,
          notify_mq4_good: this.userSystemConfig.notifyMq4Good,
          notify_mq4_warning: this.userSystemConfig.notifyMq4Warning,
          notify_mq4_bad: this.userSystemConfig.notifyMq4Bad
        };
        
        const response = await fetch(`${environment.apiBaseUrl}/configuracion-notificaciones/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(configToSave)
        });

        if (response.ok) {
          // También guardar en localStorage como respaldo
          if (this.isBrowser) {
            localStorage.setItem('user_notification_config', JSON.stringify(this.userSystemConfig));
          }
          this.notifications.showSuccess('Éxito', 'Configuración de notificaciones guardada correctamente');
        } else {
          throw new Error('Error al guardar en el backend');
        }
      } else {
        // Solo guardar en localStorage si no hay token
        if (this.isBrowser) {
          localStorage.setItem('user_notification_config', JSON.stringify(this.userSystemConfig));
        }
        this.notifications.showSuccess('Éxito', 'Configuración de notificaciones guardada localmente');
      }
    } catch (error) {
      // Respaldo: guardar en localStorage
      if (this.isBrowser) {
        localStorage.setItem('user_notification_config', JSON.stringify(this.userSystemConfig));
      }
      this.notifications.showSuccess('Éxito', 'Configuración guardada localmente');
    } finally {
      this.isLoading = false;
    }
  }

  private actualizarTokenLocal(): void {
    if (!this.isBrowser) return;
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        payload.nombre = this.nombre;
        
        // Solo actualizar el payload en localStorage, no recrear el token
        localStorage.setItem('user_payload', JSON.stringify(payload));
        
        // Disparar evento personalizado para notificar a otros componentes
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: { nombre: this.nombre } }));
      }
    } catch (error) {
    }
  }

  // Password strength methods
  getPasswordStrength(): number {
    if (!this.passwordNueva) return 0;
    
    let strength = 0;
    const password = this.passwordNueva;
    
    // Length check
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    if (password.length >= 12) strength += 10;
    
    // Character variety
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    // Common patterns (penalty)
    if (/(.)\1{2,}/.test(password)) strength -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) strength -= 10; // Common sequences
    
    return Math.max(0, Math.min(100, strength));
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 30) return 'weak';
    if (strength < 60) return 'fair';
    if (strength < 80) return 'good';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 30) return 'Débil';
    if (strength < 60) return 'Regular';
    if (strength < 80) return 'Buena';
    return 'Fuerte';
  }

  isPasswordFormValid(): boolean {
    return this.passwordActual.length > 0 && 
           this.passwordNueva.length >= 6 && 
           this.passwordNueva === this.passwordConfirmar &&
           this.passwordActual !== this.passwordNueva;
  }

  clearPasswordForm(): void {
    this.passwordActual = '';
    this.passwordNueva = '';
    this.passwordConfirmar = '';
    this.passwordError = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  // Personal information methods
  isPersonalFormValid(): boolean {
    return !!(this.nombre && this.nombre.trim().length > 0 && this.nombre !== this.originalNombre);
  }

  // Personal information methods
  startEditingName(): void {
    this.isEditingName = true;
    this.personalError = '';
    this.personalSuccess = '';
  }

  cancelEditingName(): void {
    this.isEditingName = false;
    this.clearPersonalForm();
  }

  clearPersonalForm(): void {
    this.nombre = this.originalNombre;
    this.personalError = '';
    this.personalSuccess = '';
  }

  // Override savePersonalInfo to include new validation
  async savePersonalInfo(): Promise<void> {
    this.personalError = '';
    this.personalSuccess = '';
    
    if (!this.nombre || this.nombre.trim().length === 0) {
      this.personalError = 'El nombre es requerido';
      return;
    }

    if (this.nombre.trim().length < 2) {
      this.personalError = 'El nombre debe tener al menos 2 caracteres';
      return;
    }

    if (this.nombre === this.originalNombre) {
      this.personalError = 'No hay cambios para guardar';
      return;
    }

    if (!this.userId) {
      this.personalError = 'ID de usuario no encontrado';
      return;
    }

    this.isLoading = true;
    
    try {
      const userId = Number(this.userId);
      
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      });
      
      const response = await this.http.put(`${environment.apiBaseUrl}/usuarios/${userId}`, {
        nombre: this.nombre.trim()
      }, { headers }).toPromise();

      this.originalNombre = this.nombre;
      this.personalSuccess = 'Información personal actualizada correctamente';
      this.actualizarTokenLocal();
      this.isEditingName = false; // Cerrar modo de edición
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        this.personalSuccess = '';
      }, 3000);
      
    } catch (error: any) {
      this.personalError = error.error?.detail || 'Error al actualizar la información personal';
    } finally {
      this.isLoading = false;
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

  // Método para abrir modal de edición de imagen
  abrirModalImagen() {
    const dialogRef = this.dialog.open(ImageEditModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { currentImage: this.usuario?.imagen_url }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar usuario local
        this.usuario.imagen_url = result;
        
        // Actualizar token local
        this.actualizarTokenConNuevaImagen(result);
      }
    });
  }

  private actualizarTokenConNuevaImagen(nuevaUrl: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      payload.imagen_url = nuevaUrl;
      
      // Actualizar usuario en localStorage
      this.usuario.imagen_url = nuevaUrl;
      localStorage.setItem('user_payload', JSON.stringify(this.usuario));
      
        // Actualizar usuario local inmediatamente
        this.usuario.imagen_url = nuevaUrl;
        
        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new CustomEvent('userUpdated', { 
          detail: { 
            nombre: this.usuario.nombre,
            imagen_url: nuevaUrl 
          } 
        }));
        
        // Forzar detección de cambios
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userUpdated', { 
            detail: { 
              nombre: this.usuario.nombre,
              imagen_url: nuevaUrl 
            } 
          }));
        }, 100);
    } catch (e) {
      console.error('Error al actualizar token:', e);
    }
  }
}


