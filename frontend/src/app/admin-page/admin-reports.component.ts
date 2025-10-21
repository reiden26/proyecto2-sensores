import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { NotificationService } from '../shared/notification/notification.service';
import { interval, Subscription } from 'rxjs';
import { ViewChild, AfterViewInit, inject } from '@angular/core';
import { environment } from '../../environments/environment';

interface SensorData {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'warning';
  lastValue: number;
  unit: string;
  lastUpdate: Date;
}

interface AlertData {
  id: number;
  sensor: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  resolved: boolean;
}

interface AdminNotificacionRow {
  id: number;
  usuario_id: number;
  usuario_nombre?: string;
  sensor_codigo: string;
  valor: number;
  estado: 'bueno' | 'advertencia' | 'malo' | 'desconectado';
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'danger';
  leida: boolean;
  creado_en: string;
  leido_en?: string | null;
}

interface UserActivity {
  id: number;
  name: string;
  role: string;
  lastLogin: Date;
  sensorsAssigned: number;
  sessionTime: number;
  recordsInSession: number;
  isOnline: boolean;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatTabsModule,
    MatGridListModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule,
    MatInputModule
  ],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // Variables para datos de la API
  totalUsers: number = 0;
  adminUsers: number = 0;
  regularUsers: number = 0;
  
  // Variables para polling
  private pollingSubscription: Subscription | null = null;
  private pollingReportsSubscription: Subscription | null = null;
  isLoading: boolean = false;
  isLoadingAlerts: boolean = false;
  
  // Datos reales del backend
  dashboardData: any = null;
  temporalData: any = { hoy: 0, semana: 0, mes: 0 };
  alertasData: any[] = [];
  alertasFiltradas: any[] = [];
  alertasPaginadas: any[] = [];
  // Alertas personalizadas
  alertasPersonalizadasData: any[] = [];
  alertasPersonalizadasFiltradas: any[] = [];
  alertasPersonalizadasPaginadas: any[] = [];
  usuariosData: any = null;
  sensoresData: any[] = [];
  sensoresFiltrados: any[] = [];
  
  // Paginación para usuarios
  usuariosPaginados: any[] = [];
  usuariosPageSize = 5;
  usuariosCurrentPage = 0;
  usuariosTotalPages = 0;
  
  // Filtro de estado de conexión para usuarios
  selectedConnectionStatus: string = '';
  usuariosFiltrados: any[] = [];

  // Notificaciones admin
  notificacionesDataSource = new MatTableDataSource<AdminNotificacionRow>([]);
  notificacionesDisplayedColumns: string[] = ['id','usuario_id','sensor_codigo','valor','estado','titulo','tipo','leida','creado_en','acciones'];
  notifFiltroTexto: string = '';
  @ViewChild('notifPaginator') notifPaginator!: MatPaginator;
  mostrarFiltros: boolean = false;
  filtroTipo: string = '';
  filtroEstado: string = '';
  filtroSensor: string = '';
  private usuariosMap = new Map<number, string>();
  private usuariosSoloUsuario: { id: number; nombre: string }[] = [];
  isLoadingNotifs: boolean = false;

  // Paginación para alertas
  alertPageSize = 5;
  alertCurrentPage = 0;
  alertTotalPages = 0;
  pageSizeOptionsAlertas: number[] = [5, 10, 20, 100];
  
  // Datos simulados - Sensores específicos del proyecto
  sensors: SensorData[] = [
    { id: 1, name: 'MQ-135', type: 'Calidad del Aire', status: 'active', lastValue: 45.00, unit: 'ppm', lastUpdate: new Date() },
    { id: 2, name: 'MQ-7', type: 'Monóxido de Carbono', status: 'inactive', lastValue: 0.00, unit: 'ppm', lastUpdate: new Date() },
    { id: 3, name: 'MQ-4', type: 'Gas Metano', status: 'active', lastValue: 8.50, unit: 'ppm', lastUpdate: new Date() }
  ];

  alerts: AlertData[] = [
    { id: 1, sensor: 'MQ-135', message: 'Calidad del aire deteriorada', severity: 'low', timestamp: new Date(), resolved: true },
    { id: 2, sensor: 'MQ-7', message: 'Nivel de monóxido de carbono alto', severity: 'high', timestamp: new Date(), resolved: false },
    { id: 3, sensor: 'MQ-4', message: 'Concentración de metano detectada', severity: 'medium', timestamp: new Date(), resolved: false }
  ];

  userActivities: UserActivity[] = [
    { id: 1, name: 'Juan Pérez', role: 'Administrador', lastLogin: new Date(), sensorsAssigned: 8, sessionTime: 45, recordsInSession: 23, isOnline: true },
    { id: 2, name: 'María García', role: 'Usuario', lastLogin: new Date(), sensorsAssigned: 4, sessionTime: 23, recordsInSession: 12, isOnline: true },
    { id: 3, name: 'Carlos López', role: 'Usuario', lastLogin: new Date(), sensorsAssigned: 3, sessionTime: 12, recordsInSession: 8, isOnline: false },
    { id: 4, name: 'Ana Martínez', role: 'Usuario', lastLogin: new Date(), sensorsAssigned: 5, sessionTime: 67, recordsInSession: 31, isOnline: true }
  ];

  // Métricas del dashboard (se actualizarán con datos reales)
  totalSensors = 0;
  activeSensors = 0;
  inactiveSensors = 0;
  activeAlerts = 0;
  // Configuración de alertas (para tooltip)
  alertsConfig: any = null;

  // Filtros
  selectedSensor = '';
  selectedDateRange = 'today';
  selectedAlertSeverity = '';
  private filtroDesde?: Date;
  private filtroHasta?: Date;

  // Datos simulados para gráficos - Sensores específicos
  pm25Data = [
    { time: '00:00', value: 18.2 },
    { time: '04:00', value: 22.1 },
    { time: '08:00', value: 28.5 },
    { time: '12:00', value: 35.3 },
    { time: '16:00', value: 31.7 },
    { time: '20:00', value: 25.8 }
  ];

  airQualityData = [
    { time: '00:00', value: 42 },
    { time: '04:00', value: 38 },
    { time: '08:00', value: 45 },
    { time: '12:00', value: 52 },
    { time: '16:00', value: 48 },
    { time: '20:00', value: 44 }
  ];

  methaneData = [
    { time: '00:00', value: 8.5 },
    { time: '04:00', value: 7.2 },
    { time: '08:00', value: 9.1 },
    { time: '12:00', value: 10.3 },
    { time: '16:00', value: 8.8 },
    { time: '20:00', value: 7.9 }
  ];

  // Copias originales para filtros
  private pm25DataOriginal: any[] = [];
  private airQualityDataOriginal: any[] = [];
  private methaneDataOriginal: any[] = [];

  // Lecturas crudas para recalcular series según rango
  private rawLecturas: { mq135: any[]; mq7: any[]; mq4: any[] } = { mq135: [], mq7: [], mq4: [] };

  coData = [
    { time: '00:00', value: 0.0 },
    { time: '04:00', value: 0.0 },
    { time: '08:00', value: 0.0 },
    { time: '12:00', value: 0.0 },
    { time: '16:00', value: 0.0 },
    { time: '20:00', value: 0.0 }
  ];

  // Carrusel de gráficas (3 sensores, mostrar 2 a la vez)
  chartIndex = 0; // índice del primer gráfico visible
  chartDefs = [
    { key: 'mq135', title: 'MQ-135 - Calidad del Aire - Últimas 24h', subtitle: 'Calidad del Aire - Últimas 24h', color: '#667eea', unit: 'μg/m³' },
    { key: 'mq7', title: 'MQ-7 - Monóxido de Carbono - Últimas 24h', subtitle: 'Monóxido de Carbono - Últimas 24h', color: '#f59e0b', unit: 'ppm' },
    { key: 'mq4', title: 'MQ-4 - Gas Metano - Últimas 24h', subtitle: 'Gas Metano - Últimas 24h', color: '#ef4444', unit: 'ppm' }
  ];
  animationClass = '';

  private notificationService = inject(NotificationService);

  constructor(
    private http: HttpClient, 
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.startPolling();
    // Escuchar eventos de actualización del usuario para sincronizar imágenes
    window.addEventListener('userUpdated', this.onUserUpdated.bind(this));
  }

  ngOnDestroy(): void {
    this.stopPolling();
    // Remover listener de eventos de usuario
    window.removeEventListener('userUpdated', this.onUserUpdated.bind(this));
  }

  ngAfterViewInit(): void {
    // asociar paginador cuando esté disponible
    if (this.notifPaginator) {
      this.notificacionesDataSource.paginator = this.notifPaginator;
    }
    // asegurar filtro reactivo usa un objeto; Angular requiere cambio de referencia
    this.notificacionesDataSource.filterPredicate = (row, filter) => {
      try {
        const f = JSON.parse(filter || '{}');
        const txt = (f.txt || '').toLowerCase();
        const tipo = (f.tipo || '').toLowerCase();
        const estado = (f.estado || '').toLowerCase();
        const sensor = (f.sensor || '').toLowerCase();
        const blob = `${row.id} ${row.usuario_id} ${row.sensor_codigo} ${row.estado} ${row.titulo} ${row.mensaje} ${row.tipo}`.toLowerCase();
        const matchesTxt = !txt || blob.includes(txt);
        const matchesTipo = !tipo || (row.tipo || '').toLowerCase() === tipo;
        const matchesEstado = !estado || (row.estado || '').toLowerCase() === estado;
        const matchesSensor = !sensor || (row.sensor_codigo || '').toLowerCase() === sensor;
        return matchesTxt && matchesTipo && matchesEstado && matchesSensor;
      } catch { return true; }
    };
  }

  startPolling(): void {
    // Actualizar estado de usuarios cada 5 segundos
    this.pollingSubscription = interval(5000).subscribe(() => {
      this.updateUserStatus();
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    if (this.pollingReportsSubscription) {
      this.pollingReportsSubscription.unsubscribe();
      this.pollingReportsSubscription = null;
    }
  }

  updateUserStatus(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.get(`${environment.apiBaseUrl}/admin/estado-usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        // Actualizar solo el estado de conexión de los usuarios
        if (response.usuarios && this.usuariosData && this.usuariosData.actividad_usuarios && Array.isArray(this.usuariosData.actividad_usuarios)) {
          let cambiosDetectados = false;
          this.usuariosData.actividad_usuarios.forEach((usuario: any) => {
            const usuarioActualizado = response.usuarios.find((u: any) => u.id === usuario.id);
            if (usuarioActualizado) {
              const estadoAnterior = usuario.esta_conectado;
              usuario.esta_conectado = usuarioActualizado.esta_conectado;
              usuario.ultima_conexion = usuarioActualizado.ultima_conexion;
              
              if (estadoAnterior !== usuario.esta_conectado) {
                cambiosDetectados = true;
              }
            }
          });
          
          if (cambiosDetectados) {
            // Forzar detección de cambios de Angular
            this.cdr.detectChanges();
          }
        }
      },
      error: () => {}
    });
  }

  // Método para probar manualmente la actualización
  probarActualizacion(): void {
    this.updateUserStatus();
  }

  // Método para sincronizar imágenes de usuario cuando se actualizan
  onUserUpdated(event: any): void {
    if (event.detail && event.detail.imagen_url) {
      // Buscar el usuario en la lista y actualizar su imagen
      const userId = this.getUserIdFromEvent(event);
      if (userId && this.usuariosData?.actividad_usuarios) {
        const user = this.usuariosData.actividad_usuarios.find((u: any) => u.id === userId);
        if (user) {
          user.imagen_url = event.detail.imagen_url;
          // Forzar actualización de la vista
          this.cdr.detectChanges();
        }
      }
    }
  }

  private getUserIdFromEvent(event: any): number | null {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user_id;
      }
    } catch (e) {
      console.error('Error al obtener user_id del evento:', e);
    }
    return null;
  }

  loadAllData(): void {
    this.isLoading = true;
    
    // Obtener token para autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      this.isLoading = false;
      return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Cargar datos del dashboard
    this.http.get<any>(`${environment.apiBaseUrl}/reportes/dashboard`, { headers }).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.totalSensors = data.total_sensores;
        this.activeSensors = data.sensores_activos;
        this.inactiveSensors = data.sensores_inactivos;
        this.activeAlerts = data.alertas_activas;
        // Cargar datos temporales iniciales
        this.cargarDatosTemporales(headers);
      },
      error: () => {}
    });

    // Cargar configuración del sistema (umbrales/flags/volumen) para tooltip
    this.http.get<any>(`${environment.apiBaseUrl}/configuracion-sistema`, { headers }).subscribe({
      next: (cfg) => {
        this.alertsConfig = cfg || null;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
    
    // Cargar alertas según rango seleccionado
    this.cargarAlertasPorRango(headers);
    // Cargar alertas personalizadas según rango seleccionado
    this.cargarAlertasPersonalizadasPorRango(headers);
    
    // Cargar datos de usuarios
    this.http.get<any>(`${environment.apiBaseUrl}/reportes/usuarios`, { headers }).subscribe({
      next: (data) => {
        // Normalizar estructura de usuarios para asegurar campos usados en el template
        if (data?.actividad_usuarios && Array.isArray(data.actividad_usuarios)) {
          data.actividad_usuarios = data.actividad_usuarios.map((u: any) => ({
            ...u,
            // Asegurar conteo de lecturas y duración
            total_lecturas: typeof u.total_lecturas === 'number' ? u.total_lecturas : (u.total_registros || 0),
            duracion_ultima_sesion: typeof u.duracion_ultima_sesion === 'number' ? u.duracion_ultima_sesion : (u.ultima_sesion_duracion || 0),
            // Unificar timestamp de última conexión/sesión
            ultima_conexion: u.ultima_conexion || u.ultima_sesion || u.ultima_actividad || null,
            // Soporte opcional para inicio/fin de última sesión si vienen separados
            ultima_sesion_inicio: u.ultima_sesion_inicio || u.sesion_inicio || null,
            ultima_sesion_fin: u.ultima_sesion_fin || u.sesion_fin || null,
            // Asegurar que imagen_url esté disponible
            imagen_url: u.imagen_url || null
          }));
        }
        this.usuariosData = data;
        this.totalUsers = data.estadisticas.total_usuarios;
        this.adminUsers = data.estadisticas.admin_usuarios;
        this.regularUsers = data.estadisticas.usuarios_regulares;
        
        // Inicializar filtro y paginación
        this.usuariosFiltrados = this.getFilteredUsers();
        this.inicializarPaginacionUsuarios();
      },
      error: () => {}
    });
    
    // Cargar estado de sensores
    this.http.get<any>(`${environment.apiBaseUrl}/reportes/sensores`, { headers }).subscribe({
      next: (data) => {
        this.sensoresData = data.sensores;
        // Actualizar el array de sensores para compatibilidad
        this.sensors = data.sensores.map((sensor: any) => ({
          id: sensor.id,
          name: sensor.nombre,
          type: sensor.descripcion,
          status: sensor.estado,
          lastValue: sensor.valor_actual,
          unit: sensor.unidad,
          lastUpdate: sensor.ultima_actualizacion ? new Date(sensor.ultima_actualizacion) : new Date()
        }));
        this.sensoresFiltrados = [...this.sensors];
        this.isLoading = false;
        // Cargar series reales para las gráficas (últimas 24h)
        this.cargarSeriesReales(headers);
      },
      error: () => { this.isLoading = false; }
    });

    // Cargar mapa de usuarios (para mostrar nombre en la tabla)
    this.http.get<any>(`${environment.apiBaseUrl}/usuarios`, { headers }).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.usuarios || []);
        (list || []).forEach((u: any) => {
          const id = Number(u?.id);
          const nombre = String(u?.nombre ?? u?.name ?? u?.usuario ?? u?.email ?? '');
          if (!Number.isNaN(id) && nombre) this.usuariosMap.set(id, nombre);
          const rol = String(u?.rol ?? u?.role ?? '').toLowerCase();
          if (rol === 'usuario' && !Number.isNaN(id) && nombre) {
            this.usuariosSoloUsuario.push({ id, nombre });
          }
        });
      },
      error: () => {}
    });

    // Cargar notificaciones admin
    this.isLoadingNotifs = true;
    this.http.get<AdminNotificacionRow[]>(`${environment.apiBaseUrl}/notificaciones/admin?order=asc&limit=100000`, { headers }).subscribe({
      next: (rows) => {
        // Normalizar fechas a string legible
        const mapped = (rows || []).map(r => ({
          ...r,
          usuario_nombre: this.usuariosMap.get(Number((r as any).usuario_id)) || '',
          creado_en: r?.creado_en ? String(r.creado_en) : '',
          leido_en: r?.leido_en ? String(r.leido_en) : null
        }));
        // Si aún no teníamos el nombre en mapa (por timing), intentar completar al renderizar
        this.notificacionesDataSource.connect().subscribe(data => {
          data.forEach((row: any) => {
            if (!row.usuario_nombre) {
              const name = this.usuariosMap.get(Number(row.usuario_id));
              if (name) row.usuario_nombre = name;
            }
          });
        });
        // Orden por ID ascendente
        mapped.sort((a, b) => Number(a.id) - Number(b.id));
        this.notificacionesDataSource.data = mapped;
        setTimeout(() => {
          if (this.notifPaginator) this.notificacionesDataSource.paginator = this.notifPaginator;
          this.cdr.detectChanges();
        });
        this.aplicarFiltroNotificaciones();
        this.isLoadingNotifs = false;
      },
      error: () => { this.isLoadingNotifs = false; }
    });

    // Polling periódico para refrescar dashboard y alertas sin F5
    if (this.pollingReportsSubscription) {
      this.pollingReportsSubscription.unsubscribe();
      this.pollingReportsSubscription = null;
    }
    this.pollingReportsSubscription = interval(5000).subscribe(() => {
      const t = localStorage.getItem('token');
      if (!t) return;
      const hdrs = { 'Authorization': `Bearer ${t}` };
      this.http.get<any>(`${environment.apiBaseUrl}/reportes/dashboard`, { headers: hdrs }).subscribe({
        next: (data) => {
          this.totalSensors = data.total_sensores;
          this.activeSensors = data.sensores_activos;
          this.inactiveSensors = data.sensores_inactivos;
          this.activeAlerts = data.alertas_activas;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
      this.cargarAlertasPorRango(hdrs);
      this.cargarAlertasPersonalizadasPorRango(hdrs);
    });
  }

  updateSimulatedData(): void {
    // Simular cambios en los datos
    this.sensors.forEach(sensor => {
      if (sensor.status === 'active') {
        // Simular variaciones pequeñas en los valores
        const variation = (Math.random() - 0.5) * 2;
        sensor.lastValue = Math.max(0, sensor.lastValue + variation);
        // Limitar a 2 decimales
        sensor.lastValue = Math.round(sensor.lastValue * 100) / 100;
        sensor.lastUpdate = new Date();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'inactive': return 'accent';
      default: return 'primary';
    }
  }

  getSeverityColor(severity: string): string {
    if (!severity) return 'primary';
    const s = String(severity).toLowerCase();
    // Colores del tema: 'warn' rojo, 'accent' teal, 'primary' azul/teal
    if (s === 'malo') return 'warn';
    if (s === 'advertencia') return 'accent';
    return 'primary'; // bueno
  }

  getSeverityHex(severity: string): string {
    const s = (severity || '').toLowerCase();
    if (s === 'malo') return '#d32f2f';       // rojo
    if (s === 'advertencia') return '#f59e0b'; // ámbar
    return '#2e7d32';                          // verde para bueno
  }

  getSeverityClass(severity: string): string {
    const s = (severity || '').toLowerCase();
    if (s === 'malo') return 'sev-malo';
    if (s === 'advertencia') return 'sev-advertencia';
    return 'sev-bueno';
  }

  getSensorIcon(sensorName: string): string {
    switch (sensorName) {
      case 'MQ-135': return 'air';
      case 'MQ-7': return 'warning';
      case 'MQ-4': return 'gas_meter';
      default: return 'sensors';
    }
  }

  exportReport(format: string): void {}

  refreshData(): void { this.loadAllData();   }

  private cargarDatosTemporales(headers: any): void {
    // Cargar datos para hoy, semana y mes
    const scopes = ['today', 'week', 'month'];
    scopes.forEach(scope => {
      this.http.get<any>(`${environment.apiBaseUrl}/reportes/analitica?scope=${scope}`, { headers }).subscribe({
        next: (data) => {
          if (scope === 'today') this.temporalData.hoy = data?.totales?.total || 0;
          else if (scope === 'week') this.temporalData.semana = data?.totales?.total || 0;
          else if (scope === 'month') this.temporalData.mes = data?.totales?.total || 0;
        },
        error: () => {}
      });
    });
  }

  private cargarAlertasPersonalizadasPorRango(headers: any): void {
    this.isLoadingAlerts = true;
    const base = `${environment.apiBaseUrl}/reportes/alertas-personalizadas`;
    let rango = 'today';
    if (this.selectedDateRange === 'week') rango = 'week';
    else if (this.selectedDateRange === 'month') rango = 'month';
    const url = `${base}?rango=${rango}`;
    this.http.get<any>(url, { headers }).subscribe({
      next: (data) => {
        this.alertasPersonalizadasData = data?.alertas || [];
        this.alertasPersonalizadasFiltradas = [...this.alertasPersonalizadasData];
        this.alertasPersonalizadasPaginadas = this.alertasPersonalizadasFiltradas.slice(0, this.alertPageSize);
        this.isLoadingAlerts = false;
      },
      error: () => { this.isLoadingAlerts = false; }
    });
  }

  // ---------- Filtros ----------
  onChangeSensor(): void {
    // Filtrar tarjetas de estado
    if (!this.selectedSensor) {
      this.sensoresFiltrados = [...this.sensors];
    } else {
      this.sensoresFiltrados = this.sensors.filter(s => s.name === this.selectedSensor);
    }

    // Restaurar series, no vaciarlas (se ocultarán por plantilla)
    this.pm25Data = [...this.pm25DataOriginal];
    this.airQualityData = [...this.airQualityDataOriginal];
    this.methaneData = [...this.methaneDataOriginal];

    // Filtrar alertas por sensor
    this.aplicarFiltrosAlertas();

    // Ajustar carrusel para que el gráfico elegido aparezca primero
    const map: any = { 'MQ-135': 'mq135', 'MQ-7': 'mq7', 'MQ-4': 'mq4' };
    if (this.selectedSensor && map[this.selectedSensor]) {
      const key = map[this.selectedSensor];
      const idx = this.chartDefs.findIndex(d => d.key === key);
      if (idx >= 0) this.chartIndex = idx;
    }
  }

  shouldShowChart(key: string): boolean {
    if (!this.selectedSensor) return true;
    if (this.selectedSensor === 'MQ-135') return key === 'mq135';
    if (this.selectedSensor === 'MQ-7') return key === 'mq7';
    if (this.selectedSensor === 'MQ-4') return key === 'mq4';
    return true;
  }

  onChangeDateRange(): void {
    // Mapear opciones de UI a rango
    const hoy = new Date();
    const inicio = new Date(hoy);
    switch (this.selectedDateRange) {
      case 'today':
        inicio.setHours(0,0,0,0);
        this.filtroDesde = inicio;
        this.filtroHasta = hoy;
        break;
      case 'week':
        inicio.setDate(hoy.getDate() - 7);
        this.filtroDesde = inicio;
        this.filtroHasta = hoy;
        break;
      case 'month':
        inicio.setDate(hoy.getDate() - 30);
        this.filtroDesde = inicio;
        this.filtroHasta = hoy;
        break;
      default:
        this.filtroDesde = undefined;
        this.filtroHasta = undefined;
    }
    

    // Recargar alertas desde backend usando el rango elegido
    const token = localStorage.getItem('token');
    if (token) {
      const headers = { 'Authorization': `Bearer ${token}` };
      this.cargarAlertasPorRango(headers);
      this.cargarAlertasPersonalizadasPorRango(headers);
      // Actualizar analítica temporal (hoy/semana/mes)
      const scope = this.selectedDateRange === 'week' ? 'week' : (this.selectedDateRange === 'month' ? 'month' : 'today');
      this.http.get<any>(`${environment.apiBaseUrl}/reportes/analitica?scope=${scope}`, { headers }).subscribe({ next: (d)=> { this.dashboardData = { ...(this.dashboardData||{}), temporalTotals: d?.totales, temporalLabel: d?.label }; }, error: ()=>{} });
    }

    // Aplicar a series
    const filtrarSerie = (serie: any[]) => {
      if (!this.filtroDesde || !this.filtroHasta) return serie;
      // Nuestras series son slots horarios sintéticos; mantenemos todas por ahora
      return serie;
    };
    this.pm25Data = filtrarSerie(this.pm25DataOriginal);
    this.airQualityData = filtrarSerie(this.airQualityDataOriginal);
    this.methaneData = filtrarSerie(this.methaneDataOriginal);

    // Aplicar a alertas
    this.aplicarFiltrosAlertas();
  }

  private cargarAlertasPorRango(headers: any): void {
    this.isLoadingAlerts = true;
    // Usar base del environment para coincidir con el backend actual
    const base = `${environment.apiBaseUrl}/reportes/alertas`;
    let rango = 'today';
    if (this.selectedDateRange === 'week') rango = 'week';
    else if (this.selectedDateRange === 'month') rango = 'month';
    const url = `${base}?rango=${rango}`;
    this.http.get<any>(url, { headers }).subscribe({
      next: (data) => {
        this.alertasData = data?.alertas || [];
        this.aplicarFiltrosAlertas();
        this.isLoadingAlerts = false;
        // Recalcular series por rango para panel de sensores
        this.recalcularSeriesPorRango();
      },
      error: () => { this.isLoadingAlerts = false; }
    });
  }

  onChangeSeverity(): void {
    this.aplicarFiltrosAlertas();
  }

  private aplicarFiltrosAlertas(): void {
    const sensorMap: any = {
      'MQ-135': 'mq135',
      'MQ-7': 'mq7',
      'MQ-4': 'mq4'
    };
    const normalizeSeverity = (s: string) => {
      if (!s) return '';
      const lower = s.toLowerCase();
      if (lower === 'mala') return 'malo';
      if (lower === 'todas' || lower === 'todes' || lower === 'all') return '';
      return lower;
    };
    const selectedSeverity = normalizeSeverity(this.selectedAlertSeverity);
    
    this.alertasFiltradas = (this.alertasData || []).filter(a => {
      let ok = true;
      // Sensor
      if (this.selectedSensor) {
        const sel = this.selectedSensor;
        ok = ok && (
          (sel === 'MQ-135' && a.sensor === 'MQ-135') ||
          (sel === 'MQ-7' && a.sensor === 'MQ-7') ||
          (sel === 'MQ-4' && a.sensor === 'MQ-4')
        );
      }
      // Severidad
      if (selectedSeverity) {
        ok = ok && (String(a.severidad).toLowerCase() === selectedSeverity);
      }
      // Fecha (aplicar también en cliente por robustez)
      if (this.filtroDesde && this.filtroHasta) {
        const rawTs: any = (a as any).timestamp || (a as any).creado_en || (a as any).fecha || null;
        const t = rawTs ? new Date(rawTs) : null;
        if (!t) return false;
        ok = ok && (t >= this.filtroDesde && t <= this.filtroHasta);
      }
      return ok;
    });
    

    // Reiniciar y aplicar paginación
    this.alertCurrentPage = 0;
    this.actualizarPaginacionAlertas();
  }

  private actualizarPaginacionAlertas(): void {
    const total = this.alertasFiltradas.length || 0;
    this.alertTotalPages = Math.max(1, Math.ceil(total / this.alertPageSize));
    const start = this.alertCurrentPage * this.alertPageSize;
    const end = start + this.alertPageSize;
    this.alertasPaginadas = this.alertasFiltradas.slice(start, end);
  }

  // ------- CRUD Notificaciones (admin) -------
  aplicarFiltroNotificaciones(): void {
    const payload = {
      txt: (this.notifFiltroTexto || '').trim(),
      tipo: this.filtroTipo || '',
      estado: this.filtroEstado || '',
      sensor: this.filtroSensor || ''
    };
    // Cambiar referencia para disparar filtrado
    this.notificacionesDataSource.filter = JSON.stringify(payload);
    if (this.notifPaginator) this.notifPaginator.firstPage();
  }

  crearNotificacion(row?: Partial<AdminNotificacionRow>): void {
    const body: any = {
      usuario_id: row?.usuario_id ?? null,
      sensor_codigo: row?.sensor_codigo ?? 'mq135',
      valor: row?.valor ?? 0,
      estado: row?.estado ?? 'bueno',
      titulo: row?.titulo ?? '',
      mensaje: row?.mensaje ?? '',
      tipo: row?.tipo ?? 'info',
      leida: row?.leida ?? false
    };
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post<AdminNotificacionRow>(`${environment.apiBaseUrl}/notificaciones`, body, { headers }).subscribe({
      next: (created) => {
        const data = [created, ...this.notificacionesDataSource.data];
        data.sort((a, b) => Number(a.id) - Number(b.id));
        this.notificacionesDataSource.data = data;
      }
    });
  }

  actualizarNotificacion(row: AdminNotificacionRow): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    const cambios: any = {
      usuario_id: row.usuario_id,
      sensor_codigo: row.sensor_codigo,
      valor: row.valor,
      estado: row.estado,
      titulo: row.titulo,
      mensaje: row.mensaje,
      tipo: row.tipo,
      leida: row.leida
    };
    this.http.put<AdminNotificacionRow>(`${environment.apiBaseUrl}/notificaciones/${row.id}`, cambios, { headers }).subscribe({
      next: (updated) => {
        const data = this.notificacionesDataSource.data.map(r => r.id === updated.id ? updated : r);
        data.sort((a, b) => Number(a.id) - Number(b.id));
        this.notificacionesDataSource.data = data;
        this.aplicarFiltroNotificaciones();
      }
    });
  }

  

  eliminarNotificacion(row: AdminNotificacionRow): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Eliminación',
        message: '¿Estás seguro de que quieres eliminar esta notificación del sistema?',
        itemName: `Notificación #${row.id} • ${row.titulo || row.tipo}`
      }
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.delete(`${environment.apiBaseUrl}/notificaciones/${row.id}`, { headers }).subscribe({
        next: () => {
          this.notificacionesDataSource.data = this.notificacionesDataSource.data.filter(r => r.id !== row.id);
          this.aplicarFiltroNotificaciones();
          this.notificationService.showUserSuccess('Notificación eliminada correctamente');
        },
        error: (err) => {
          console.error('Error eliminando notificación:', err);
          this.notificationService.showUserError('eliminar notificación', 'No se pudo eliminar la notificación');
        }
      });
    });
  }

  // ---- Diálogo de edición ----
  abrirDialogoEditar(row: AdminNotificacionRow): void {
    const dialogRef = this.dialog.open(NotifEditDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { ...row, usuarios: this.usuariosSoloUsuario }
    });
    dialogRef.afterClosed().subscribe((result: AdminNotificacionRow | null) => {
      if (!result) return;
      this.actualizarNotificacion(result);
    });
  }

  paginaAnteriorAlertas(): void {
    if (this.alertCurrentPage > 0) {
      this.alertCurrentPage--;
      this.actualizarPaginacionAlertas();
    }
  }

  siguientePaginaAlertas(): void {
    if (this.alertCurrentPage < this.alertTotalPages - 1) {
      this.alertCurrentPage++;
      this.actualizarPaginacionAlertas();
    }
  }

  irAPaginaAlertas(i: number): void {
    if (i >= 0 && i < this.alertTotalPages) {
      this.alertCurrentPage = i;
      this.actualizarPaginacionAlertas();
    }
  }

  onPageAlertas(event: PageEvent): void {
    this.alertPageSize = event.pageSize;
    this.alertCurrentPage = event.pageIndex;
    this.actualizarPaginacionAlertas();
  }

  // Métodos para generar los gráficos SVG
  getXPosition(index: number): number {
    const spacing = 400 / 5; // 6 puntos, 5 espacios
    return 20 + (index * spacing);
  }

  getYPosition(value: number, data: any[]): number {
    const values = (data || []).map(d => Number(d?.value)).filter(v => Number.isFinite(v));
    if (values.length === 0 || !Number.isFinite(Number(value))) {
      return 180 - (0.5 * 160) + 10;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const normalizedValue = (Number(value) - min) / range;
    return 180 - (normalizedValue * 160) + 10; // Invertir Y y agregar margen
  }

  getPM25ChartPoints(): string {
    return this.pm25Data.map((point, index) => {
      const x = this.getXPosition(index);
      const y = this.getYPosition(point.value, this.pm25Data);
      return `${x},${y}`;
    }).join(' ');
  }

  getAirQualityChartPoints(): string {
    return this.airQualityData.map((point, index) => {
      const x = this.getXPosition(index);
      const y = this.getYPosition(point.value, this.airQualityData);
      return `${x},${y}`;
    }).join(' ');
  }

  // Helpers para carrusel
  getDataByKey(key: string): any[] {
    switch (key) {
      case 'mq135': return this.pm25Data;
      case 'mq7': return this.airQualityData;
      case 'mq4': return this.methaneData;
      default: return this.pm25Data;
    }
  }

  getChartPointsByKey(key: string): string {
    const data = this.getSafeDataByKey(key);
    if (data.length === 0) return '';
    return data.map((point, index) => {
      const x = this.getXPosition(index);
      const y = this.getYPosition(point.value, data);
      return `${x},${y}`;
    }).join(' ');
  }

  isFiniteNumber(value: any): boolean {
    return Number.isFinite(Number(value));
  }

  getSafeDataByKey(key: string): any[] {
    return (this.getDataByKey(key) || []).filter(p => this.isFiniteNumber(p?.value));
  }

  getVisibleCharts(): any[] {
    // Si hay sensor seleccionado, mostrar solo su gráfica como primera
    if (this.selectedSensor) {
      const map: any = { 'MQ-135': 'mq135', 'MQ-7': 'mq7', 'MQ-4': 'mq4' };
      const key = map[this.selectedSensor];
      const chosen = this.chartDefs.find(d => d.key === key);
      return chosen ? [chosen] : [];
    }
    // Sin filtro: mostrar dos consecutivas
    const first = this.chartDefs[this.chartIndex % this.chartDefs.length];
    const second = this.chartDefs[(this.chartIndex + 1) % this.chartDefs.length];
    return [first, second];
  }

  nextCharts(): void {
    this.animationClass = 'slide-next';
    setTimeout(() => {
      this.chartIndex = (this.chartIndex + 1) % this.chartDefs.length;
      this.animationClass = 'enter-next';
      setTimeout(() => {
        this.animationClass = '';
      }, 250);
    }, 200);
  }

  prevCharts(): void {
    this.animationClass = 'slide-prev';
    setTimeout(() => {
      this.chartIndex = (this.chartIndex - 1 + this.chartDefs.length) % this.chartDefs.length;
      this.animationClass = 'enter-prev';
      setTimeout(() => {
        this.animationClass = '';
      }, 250);
    }, 200);
  }

  // Cargar series reales desde backend admin y agrupar por hora (últimas 24h)
  private cargarSeriesReales(headers: any): void {
    this.http.get<any>(`${environment.apiBaseUrl}/lecturas/admin?limit=1000`, { headers }).subscribe({
      next: (data) => {
        // Guardar lecturas crudas para recalcular por rango
        this.rawLecturas = {
          mq135: data.mq135 || [],
          mq7: data.mq7 || [],
          mq4: data.mq4 || []
        };
        // Recalcular según rango actual
        this.recalcularSeriesPorRango();
      },
      error: () => {}
    });
  }

  private getTituloRango(): string {
    if (this.selectedDateRange === 'week') return 'Esta semana';
    if (this.selectedDateRange === 'month') return 'Este mes';
    return 'Últimas 24h';
  }

  private recalcularSeriesPorRango(): void {
    const ahora = new Date();
    let desde: Date;
    if (this.selectedDateRange === 'week') desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (this.selectedDateRange === 'month') desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    else desde = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const construirSerie = (items: any[], stepHours: number) => {
      const filtrados = items.filter((i: any) => new Date(i.fecha_lectura) >= desde);
      const serie: { time: string, value: number }[] = [];
      const totalHoras = Math.ceil((ahora.getTime() - desde.getTime()) / (60 * 60 * 1000));
      for (let h = 0; h <= totalHoras; h += stepHours) {
        const t0 = new Date(desde.getTime() + h * 60 * 60 * 1000);
        const t1 = new Date(Math.min(ahora.getTime(), t0.getTime() + stepHours * 60 * 60 * 1000));
        const enVentana = filtrados.filter((r: any) => {
          const t = new Date(r.fecha_lectura);
          return t >= t0 && t < t1;
        });
        if (enVentana.length === 0) continue; // saltar huecos sin lecturas
        const avg = enVentana.reduce((acc: number, r: any) => acc + Number(r.valor), 0) / enVentana.length;
        if (!Number.isFinite(avg) || Math.abs(avg) < 1e-6) continue; // saltar ceros/vacios
        const label = this.selectedDateRange === 'today'
          ? `${('0' + t0.getHours()).slice(-2)}:00`
          : `${('0' + (t0.getMonth() + 1)).slice(-2)}/${('0' + t0.getDate()).slice(-2)}`;
        serie.push({ time: label, value: Number(avg.toFixed(2)) });
      }
      return serie;
    };

    let step = 4; // horas por punto
    if (this.selectedDateRange === 'week') step = 3;     // 8 puntos por día para mayor detalle
    else if (this.selectedDateRange === 'month') step = 24; // 1 punto por día
    this.pm25Data = construirSerie(this.rawLecturas.mq135, step);
    this.airQualityData = construirSerie(this.rawLecturas.mq7, step);
    this.methaneData = construirSerie(this.rawLecturas.mq4, step);

    // Guardar copias
    this.pm25DataOriginal = [...this.pm25Data];
    this.airQualityDataOriginal = [...this.airQualityData];
    this.methaneDataOriginal = [...this.methaneData];

    // Actualizar títulos
    const rangoTxt = this.getTituloRango();
    this.chartDefs = this.chartDefs.map(d => ({
      ...d,
      title: `${d.key === 'mq135' ? 'MQ-135 - Calidad del Aire' : d.key === 'mq7' ? 'MQ-7 - Monóxido de Carbono' : 'MQ-4 - Gas Metano'} - ${rangoTxt}`,
      subtitle: `${d.key === 'mq135' ? 'Calidad del Aire' : d.key === 'mq7' ? 'Monóxido de Carbono' : 'Gas Metano'} - ${rangoTxt}`
    }));

    // Reaplicar filtro de sensor y forzar CD
    this.onChangeSensor();
    this.cdr.detectChanges();
  }

  // ---------- Exportación ----------
  abrirDialogoExportar(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: {
        type: 'pdf',
        sections: {
          dashboard: true,
          sensores: true,
          alertas: true,
          usuarios: true,
          analisisTemporal: true
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const { type, sections } = result;
      if (type === 'pdf') this.exportarPDF(sections);
      else if (type === 'csv') this.exportarCSV(sections);
      else if (type === 'excel') this.exportarExcel(sections);
    });
  }

  private exportarPDF(sections: any): void {
    // Lazy import para jsPDF y autotable (función)
    // @ts-ignore
    import('jspdf').then(({ default: jsPDF }) => {
      // @ts-ignore
      import('jspdf-autotable').then(async (mod: any) => {
        const autoTable = (mod && mod.default) ? mod.default : (mod?.autoTable || (window as any)['autoTable']);
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        let y = 32;
        const addTitle = (title: string) => { doc.setFontSize(14); doc.text(title, 32, y); y += 12; };
        const addSpacer = () => { y += 10; };

        if (sections.dashboard) {
          addTitle('Dashboard');
          doc.setFontSize(11);
          doc.text(`Sensores totales: ${this.totalSensors} | Activos: ${this.activeSensors} | Inactivos: ${this.inactiveSensors} | Alertas activas: ${this.activeAlerts}`, 32, y);
          addSpacer();
        }

        if (sections.sensores) {
          addTitle('Estado de sensores');
          // @ts-ignore
          autoTable(doc, {
            startY: y,
            head: [['Nombre', 'Estado', 'Última lectura']],
            body: (this.sensoresFiltrados.length ? this.sensoresFiltrados : this.sensors).map(s => [s.name, s.status, s.lastUpdate?.toLocaleString?.() || '—'])
          });
          // @ts-ignore
          y = (doc as any).lastAutoTable.finalY + 16;
        }

        if (sections.alertas) {
          addTitle('Alertas');
          // @ts-ignore
          autoTable(doc, {
            startY: y,
            head: [['Sensor', 'Severidad', 'Mensaje', 'Usuario', 'Fecha']],
            body: (this.alertasFiltradas.length ? this.alertasFiltradas : this.alertasData).map((a: any) => [a.sensor, a.severidad, a.mensaje || a.descripcion || '', (a.usuario || a.usuario_nombre || a.correo || a.email || '—'), new Date(a.timestamp || a.creado_en).toLocaleString()])
          });
          // @ts-ignore
          y = (doc as any).lastAutoTable.finalY + 16;
        }

        if (sections.usuarios && this.usuariosData?.actividad_usuarios) {
          addTitle('Usuarios');
          // @ts-ignore
          autoTable(doc, {
            startY: y,
            head: [['Usuario', 'Rol', 'Sensores', 'Conectado', 'Última sesión', 'Total lecturas']],
            body: this.usuariosData.actividad_usuarios.map((u: any) => [
              `${u.nombre} (${u.email})`,
              u.rol,
              this.stringifySensoresAsignados(u.sensores_asignados),
              u.esta_conectado ? 'Sí' : 'No',
              u.ultima_conexion ? new Date(u.ultima_conexion).toLocaleString() : '—',
              u.total_lecturas ?? 0
            ])
          });
          // @ts-ignore
          y = (doc as any).lastAutoTable.finalY + 16;
        }

        if (sections.analisisTemporal) {
          addTitle('Análisis temporal (gráfico)');
          const dataUrl = this.renderTemporalChartToDataUrl(560, 280);
          if (dataUrl) {
            doc.addImage(dataUrl, 'PNG', 24, y, 560, 280);
            y += 280 + 12;
          } else {
            const resumen = [
              ['MQ-135 (rojo)', String(this.pm25Data.length)],
              ['MQ-7 (amarillo)', String(this.airQualityData.length)],
              ['MQ-4 (azul)', String(this.methaneData.length)]
            ];
            // @ts-ignore
            autoTable(doc, { startY: y, head: [['Serie', 'Nº puntos']], body: resumen });
            // @ts-ignore
            y = (doc as any).lastAutoTable.finalY + 16;
          }
        }

        doc.save('reporte_admin.pdf');
      });
    });
  }

  private svgToPngDataUrl(svgEl: SVGSVGElement, width: number, height: number): Promise<string> {
    return new Promise((resolve) => {
      const serializer = new XMLSerializer();
      let svgStr = serializer.serializeToString(svgEl);
      if (!svgStr.match(/^<svg[^>]+xmlns=/)) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    });
  }

  private renderTemporalChartToDataUrl(width: number, height: number): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const margin = { left: 40, right: 20, top: 20, bottom: 30 };
      const plotW = width - margin.left - margin.right;
      const plotH = height - margin.top - margin.bottom;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      // Grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x <= plotW; x += 50) {
        ctx.beginPath(); ctx.moveTo(margin.left + x, margin.top); ctx.lineTo(margin.left + x, margin.top + plotH); ctx.stroke();
      }
      for (let y = 0; y <= plotH; y += 30) {
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top + y); ctx.lineTo(margin.left + plotW, margin.top + y); ctx.stroke();
      }
      const drawSeries = (data: any[], color: string) => {
        if (!data || data.length === 0) return;
        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const rng = max - min || 1;
        const stepX = plotW / Math.max(1, data.length - 1);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.forEach((p, i) => {
          const x = margin.left + i * stepX;
          const y = margin.top + plotH - ((p.value - min) / rng) * plotH;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // points
        ctx.fillStyle = color;
        data.forEach((p, i) => {
          const x = margin.left + i * stepX;
          const y = margin.top + plotH - ((p.value - min) / rng) * plotH;
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        });
      };
      drawSeries(this.pm25Data, '#ef4444'); // MQ-135 rojo
      drawSeries(this.airQualityData, '#f59e0b'); // MQ-7 amarillo
      drawSeries(this.methaneData, '#3b82f6'); // MQ-4 azul
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  private exportarCSV(sections: any): void {
    let csv = '';
    const push = (title: string, head: string[], rows: string[][]) => {
      csv += `${title}\n`;
      csv += head.join(',') + '\n';
      rows.forEach(r => { csv += r.map(v => '"' + (v ?? '') + '"').join(',') + '\n'; });
      csv += '\n';
    };

    if (sections.dashboard) {
      push('Dashboard', ['Sensores totales','Activos','Inactivos','Alertas activas'], [[
        String(this.totalSensors), String(this.activeSensors), String(this.inactiveSensors), String(this.activeAlerts)
      ]]);
    }
    if (sections.sensores) {
      const lista = (this.sensoresFiltrados.length ? this.sensoresFiltrados : this.sensors).map((s: any) => [s.name, s.status, s.lastUpdate?.toLocaleString?.() || '—']);
      push('Sensores', ['Nombre','Estado','Última lectura'], lista);
    }
    if (sections.alertas) {
      const lista = (this.alertasFiltradas.length ? this.alertasFiltradas : this.alertasData).map((a: any) => [a.sensor, a.severidad, a.mensaje || a.descripcion || '', (a.usuario || a.usuario_nombre || a.correo || a.email || '—'), new Date(a.timestamp || a.creado_en).toLocaleString()]);
      push('Alertas', ['Sensor','Severidad','Mensaje','Usuario','Fecha'], lista);
    }
    if (sections.usuarios && this.usuariosData?.actividad_usuarios) {
      const lista = this.usuariosData.actividad_usuarios.map((u: any) => [
        `${u.nombre} (${u.email})`, u.rol, this.stringifySensoresAsignados(u.sensores_asignados), u.esta_conectado ? 'Sí' : 'No', u.ultima_conexion ? new Date(u.ultima_conexion).toLocaleString() : '—', String(u.total_lecturas ?? 0)
      ]);
      push('Usuarios', ['Usuario','Rol','Sensores','Conectado','Última sesión','Total lecturas'], lista);
    }
    if (sections.analisisTemporal) {
      const lista = [
        ...this.pm25Data.map((p: any) => ['MQ-135', String(p.value), p.time]),
        ...this.airQualityData.map((p: any) => ['MQ-7', String(p.value), p.time]),
        ...this.methaneData.map((p: any) => ['MQ-4', String(p.value), p.time])
      ];
      push('Análisis Temporal', ['Serie','Valor','Intervalo'], lista);
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'reporte_admin.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private exportarExcel(sections: any): void {
    let html = '<html><head><meta charset="UTF-8"></head><body>';
    const table = (title: string, head: string[], rows: string[][]) => {
      html += `<h3>${title}</h3><table border="1"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
      html += rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('');
      html += '</tbody></table>';
    };
    if (sections.dashboard) {
      table('Dashboard', ['Sensores totales','Activos','Inactivos','Alertas activas'], [[
        String(this.totalSensors), String(this.activeSensors), String(this.inactiveSensors), String(this.activeAlerts)
      ]]);
    }
    if (sections.sensores) {
      const lista = (this.sensoresFiltrados.length ? this.sensoresFiltrados : this.sensors).map((s: any) => [s.name, s.status, s.lastUpdate?.toLocaleString?.() || '—']);
      table('Sensores', ['Nombre','Estado','Última lectura'], lista);
    }
    if (sections.alertas) {
      const lista = (this.alertasFiltradas.length ? this.alertasFiltradas : this.alertasData).map((a: any) => [a.sensor, a.severidad, a.mensaje || a.descripcion || '', (a.usuario || a.usuario_nombre || a.correo || a.email || '—'), new Date(a.timestamp || a.creado_en).toLocaleString()]);
      table('Alertas', ['Sensor','Severidad','Mensaje','Usuario','Fecha'], lista);
    }
    if (sections.usuarios && this.usuariosData?.actividad_usuarios) {
      const lista = this.usuariosData.actividad_usuarios.map((u: any) => [
        `${u.nombre} (${u.email})`, u.rol, this.stringifySensoresAsignados(u.sensores_asignados), u.esta_conectado ? 'Sí' : 'No', u.ultima_conexion ? new Date(u.ultima_conexion).toLocaleString() : '—', String(u.total_lecturas ?? 0)
      ]);
      table('Usuarios', ['Usuario','Rol','Sensores','Conectado','Última sesión','Total lecturas'], lista);
    }
    if (sections.analisisTemporal) {
      const lista = [
        ...this.pm25Data.map((p: any) => ['MQ-135', String(p.value), p.time]),
        ...this.airQualityData.map((p: any) => ['MQ-7', String(p.value), p.time]),
        ...this.methaneData.map((p: any) => ['MQ-4', String(p.value), p.time])
      ];
      table('Análisis Temporal', ['Serie','Valor','Intervalo'], lista);
    }
    html += '</body></html>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'reporte_admin.xls';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private stringifySensoresAsignados(value: any): string {
    try {
      if (Array.isArray(value)) {
        if (value.length === 0) return '';
        const first = value[0];
        if (['string', 'number'].includes(typeof first)) {
          return value.join(', ');
        }
        if (typeof first === 'object') {
          return value.map((s: any) => s?.nombre ?? s?.name ?? s?.sensor ?? s?.codigo ?? (s?.id != null ? String(s.id) : '')).filter(Boolean).join(', ');
        }
      }
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        return Object.values(value).filter(v => v != null).join(', ');
      }
      return '';
    } catch {
      return '';
    }
  }

  // Métodos para el gráfico temporal
  getTemporalXPosition(index: number): number {
    const spacing = 600 / 5; // 6 puntos, 5 espacios
    return 30 + (index * spacing);
  }

  getTemporalYPosition(value: number, sensorType: string): number {
    let data: any[];
    switch (sensorType) {
      case 'pm25':
        data = this.pm25Data;
        break;
      case 'air':
        data = this.airQualityData;
        break;
      case 'methane':
        data = this.methaneData;
        break;
      case 'co':
        data = this.coData;
        break;
      default:
        data = this.pm25Data;
    }
    
    const min = Math.min(...data.map(d => d.value));
    const max = Math.max(...data.map(d => d.value));
    const range = max - min;
    const normalizedValue = range > 0 ? (value - min) / range : 0.5; // Evitar división por cero
    return 270 - (normalizedValue * 240) + 15; // Invertir Y y agregar margen
  }

  getTemporalChartPoints(sensorType: string): string {
    let data: any[];
    switch (sensorType) {
      case 'pm25':
        data = this.pm25Data;
        break;
      case 'air':
        data = this.airQualityData;
        break;
      case 'methane':
        data = this.methaneData;
        break;
      case 'co':
        data = this.coData;
        break;
      default:
        data = this.pm25Data;
    }
    
    return data.map((point, index) => {
      const x = this.getTemporalXPosition(index);
      const y = this.getTemporalYPosition(point.value, sensorType);
      return `${x},${y}`;
    }).join(' ');
  }

  // Funciones de filtro para usuarios
  getFilteredUsers(): any[] {
    if (!this.usuariosData?.actividad_usuarios) {
      return [];
    }
    
    if (!this.selectedConnectionStatus) {
      return this.usuariosData.actividad_usuarios;
    }
    
    return this.usuariosData.actividad_usuarios.filter((user: any) => {
      if (this.selectedConnectionStatus === 'connected') {
        return user.esta_conectado === true;
      } else if (this.selectedConnectionStatus === 'disconnected') {
        return user.esta_conectado === false;
      }
      return true;
    });
  }

  onConnectionStatusChange(): void {
    this.usuariosFiltrados = this.getFilteredUsers();
    this.usuariosCurrentPage = 0;
    this.inicializarPaginacionUsuarios();
  }

  // Funciones de paginación para usuarios
  inicializarPaginacionUsuarios(): void {
    const usuariosParaPaginacion = this.usuariosFiltrados.length > 0 ? this.usuariosFiltrados : this.usuariosData?.actividad_usuarios || [];
    this.usuariosTotalPages = Math.ceil(usuariosParaPaginacion.length / this.usuariosPageSize);
    this.cargarPaginaUsuarios(0);
  }

  cargarPaginaUsuarios(page: number): void {
    const usuariosParaPaginacion = this.usuariosFiltrados.length > 0 ? this.usuariosFiltrados : this.usuariosData?.actividad_usuarios || [];
    const startIndex = page * this.usuariosPageSize;
    const endIndex = startIndex + this.usuariosPageSize;
    this.usuariosPaginados = usuariosParaPaginacion.slice(startIndex, endIndex);
    this.usuariosCurrentPage = page;
  }

  siguientePaginaUsuarios(): void {
    if (this.usuariosCurrentPage < this.usuariosTotalPages - 1) {
      this.cargarPaginaUsuarios(this.usuariosCurrentPage + 1);
    }
  }

  paginaAnteriorUsuarios(): void {
    if (this.usuariosCurrentPage > 0) {
      this.cargarPaginaUsuarios(this.usuariosCurrentPage - 1);
    }
  }

  irAPaginaUsuarios(page: number): void {
    if (page >= 0 && page < this.usuariosTotalPages) {
      this.cargarPaginaUsuarios(page);
    }
  }
}

// ---------- Diálogo de Exportación ----------
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component as NgComponent } from '@angular/core';
// (usamos los módulos ya importados arriba en el archivo)

@NgComponent({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatRadioModule, MatCheckboxModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>Exportar</h2>
  <mat-dialog-content>
    <h3>Formato</h3>
    <mat-radio-group [(ngModel)]="type">
      <mat-radio-button value="pdf">PDF</mat-radio-button>
      <mat-radio-button value="excel">Excel</mat-radio-button>
      <mat-radio-button value="csv">CSV</mat-radio-button>
    </mat-radio-group>
    <h3 style="margin-top:16px;">Secciones</h3>
    <mat-checkbox [(ngModel)]="sections.dashboard">Dashboard</mat-checkbox>
    <mat-checkbox [(ngModel)]="sections.sensores">Estado de sensores</mat-checkbox>
    <mat-checkbox [(ngModel)]="sections.alertas">Alertas</mat-checkbox>
    <mat-checkbox [(ngModel)]="sections.usuarios">Usuarios</mat-checkbox>
    <mat-checkbox [(ngModel)]="sections.analisisTemporal">Análisis temporal</mat-checkbox>
    <div *ngIf="!hasAnySectionSelected()" style="color:#b91c1c; margin-top:8px; font-size: 12px;">Debes elegir al menos una sección</div>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="dialogRef.close()">Cancelar</button>
    <button mat-flat-button color="primary" [disabled]="!hasAnySectionSelected()" (click)="confirmar()">Exportar</button>
  </mat-dialog-actions>
  `
})
export class ExportDialogComponent {
  type: 'pdf' | 'excel' | 'csv';
  sections: any;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ExportDialogComponent>) {
    this.type = data?.type || 'pdf';
    this.sections = data?.sections || { dashboard: true, sensores: true, alertas: true, usuarios: true, analisisTemporal: true };
  }
  confirmar() { if (this.hasAnySectionSelected()) { this.dialogRef.close({ type: this.type, sections: this.sections }); } }
  hasAnySectionSelected(): boolean {
    return !!(this.sections?.dashboard || this.sections?.sensores || this.sections?.alertas || this.sections?.usuarios || this.sections?.analisisTemporal);
  }
}

@NgComponent({
  selector: 'app-notif-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
  <h2 mat-dialog-title>Editar Notificación</h2>
  <mat-dialog-content>
    <div class="dialog-grid">
      <mat-form-field appearance="outline">
        <mat-label>Usuario</mat-label>
        <mat-select [(ngModel)]="data.usuario_id">
          <mat-option *ngFor="let u of (data.usuarios || [])" [value]="u.id">{{ u.nombre }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Sensor</mat-label>
        <mat-select [(ngModel)]="data.sensor_codigo">
          <mat-option value="mq135">MQ-135</mat-option>
          <mat-option value="mq7">MQ-7</mat-option>
          <mat-option value="mq4">MQ-4</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Valor</mat-label>
        <input matInput type="number" [(ngModel)]="data.valor" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="data.estado">
          <mat-option value="bueno">Bueno</mat-option>
          <mat-option value="advertencia">Advertencia</mat-option>
          <mat-option value="malo">Malo</mat-option>
          <mat-option value="desconectado">Desconectado</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Título</mat-label>
        <input matInput [(ngModel)]="data.titulo" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Mensaje</mat-label>
        <input matInput [(ngModel)]="data.mensaje" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="data.tipo">
          <mat-option value="info">Info</mat-option>
          <mat-option value="warning">Warning</mat-option>
          <mat-option value="danger">Danger</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="full" style="display:flex; align-items:center; gap:.5rem;">
        <mat-checkbox [(ngModel)]="data.leida">Marcada como leída</mat-checkbox>
      </div>
    </div>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="dialogRef.close()">Cancelar</button>
    <button mat-flat-button color="primary" (click)="guardar()">Guardar</button>
  </mat-dialog-actions>
  `,
  styles: [`
    .dialog-grid { display:grid; grid-template-columns: repeat(2, minmax(160px, 1fr)); gap: 1rem; }
    .full { grid-column: 1 / -1; }
  `]
})
export class NotifEditDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<NotifEditDialogComponent>) {}
  guardar() { this.dialogRef.close(this.data); }
}
