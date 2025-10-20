import { Component, OnInit, AfterViewInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../shared/notification/notification.service';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

interface SensorReading {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  sensor_id: string;
  sensor_nombre: string;
  valor: number;
  fecha_lectura: string;
  estado: 'Bueno' | 'Advertencia' | 'Malo';
  created_at: string;
  updated_at: string;
}

interface Statistics {
  total: number;
  buenos: number;
  advertencias: number;
  malos: number;
}

@Component({
  selector: 'app-admin-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-data.component.html',
  styleUrls: ['./admin-data.component.css']
})
export class AdminDataComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<SensorReading>([]);
  displayedColumns: string[] = ['id', 'usuario_nombre', 'sensor_nombre', 'valor', 'estado', 'fecha_lectura', 'acciones'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  isLoading = false;
  searchTerm = '';
  selectedSensor = '';
  selectedEstado = '';
  selectedDateFrom = '';
  selectedDateTo = '';
  showFilters = false; // Controla la visibilidad de los filtros
  
  // Estadísticas
  statistics: Statistics = {
    total: 0,
    buenos: 0,
    advertencias: 0,
    malos: 0
  };
  
  // Opciones de filtros
  sensores = [
    { value: 'mq135', label: 'MQ-135 (Calidad del aire)' },
    { value: 'mq7', label: 'MQ-7 (Monóxido de carbono)' },
    { value: 'mq4', label: 'MQ-4 (Gas metano)' }
  ];
  
  estados = [
    { value: 'Bueno', label: 'Bueno' },
    { value: 'Advertencia', label: 'Advertencia' },
    { value: 'Malo', label: 'Malo' }
  ];
  
  // Variables para edición
  isEditing = false;
  currentItem: SensorReading | null = null;
  
  private isBrowser: boolean;
  
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngAfterViewInit(): void {
    // Configurar paginador y sort
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    
    // Configurar filtro personalizado como en el componente de usuario
    this.dataSource.filterPredicate = (item: SensorReading, filter: string) => {
      // Filtro por sensor
      const sensorMatch = this.selectedSensor === '' || item.sensor_id === this.selectedSensor;
      
      // Filtro por estado
      const estadoMatch = this.selectedEstado === '' || item.estado === this.selectedEstado;
      
      // Filtro por fecha desde
      const fechaDesdeMatch = this.selectedDateFrom === '' || 
        new Date(item.fecha_lectura) >= new Date(this.selectedDateFrom);
      
      // Filtro por fecha hasta
      const fechaHastaMatch = this.selectedDateTo === '' || 
        new Date(item.fecha_lectura) <= new Date(this.selectedDateTo);
      
      // Filtro de búsqueda general
      const term = this.searchTerm.trim().toLowerCase();
      const searchMatch = this.searchTerm === '' || (
        item.usuario_nombre.toLowerCase().includes(term) ||
        item.sensor_nombre.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term) ||
        item.valor.toString().includes(term) ||
        item.id.toString().includes(term) ||
        item.fecha_lectura.toLowerCase().includes(term)
      );
      
      return sensorMatch && estadoMatch && fechaDesdeMatch && fechaHastaMatch && searchMatch;
    };
  }
  
  loadData(): void {
    this.isLoading = true;
    
    // Obtener token para autenticación
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    if (!token) {
      this.snackBar.open('No estás autenticado', 'Cerrar', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
      this.isLoading = false;
      return;
    }
    
    // Cargar datos de todos los sensores usando el endpoint de admin
    this.http.get<any>(`http://localhost:8000/lecturas/admin?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        let allData: SensorReading[] = [];
        
        // Procesar datos de MQ-135
        if (data.mq135 && data.mq135.length > 0) {
          const mq135Data = data.mq135.map((item: any) => ({
            id: item.id,
            usuario_id: item.usuario_id,
            usuario_nombre: item.usuario_nombre || 'Usuario',
            sensor_id: 'mq135',
            sensor_nombre: 'MQ-135 (Calidad del aire)',
            valor: item.valor,
            fecha_lectura: item.fecha_lectura,
            estado: this.determinarEstado(item.valor, 'mq135'),
            created_at: item.creado_en,
            updated_at: item.creado_en
          }));
          allData = allData.concat(mq135Data);
        }
        
        // Procesar datos de MQ-4
        if (data.mq4 && data.mq4.length > 0) {
          const mq4Data = data.mq4.map((item: any) => ({
            id: item.id,
            usuario_id: item.usuario_id,
            usuario_nombre: item.usuario_nombre || 'Usuario',
            sensor_id: 'mq4',
            sensor_nombre: 'MQ-4 (Gas metano)',
            valor: item.valor,
            fecha_lectura: item.fecha_lectura,
            estado: this.determinarEstado(item.valor, 'mq4'),
            created_at: item.creado_en,
            updated_at: item.creado_en
          }));
          allData = allData.concat(mq4Data);
        }
        
        // Procesar datos de MQ-7
        if (data.mq7 && data.mq7.length > 0) {
          const mq7Data = data.mq7.map((item: any) => ({
            id: item.id,
            usuario_id: item.usuario_id,
            usuario_nombre: item.usuario_nombre || 'Usuario',
            sensor_id: 'mq7',
            sensor_nombre: 'MQ-7 (Monóxido de carbono)',
            valor: item.valor,
            fecha_lectura: item.fecha_lectura,
            estado: this.determinarEstado(item.valor, 'mq7'),
            created_at: item.creado_en,
            updated_at: item.creado_en
          }));
          allData = allData.concat(mq7Data);
        }
        
        // Ordenar por fecha más reciente
        allData.sort((a, b) => new Date(b.fecha_lectura).getTime() - new Date(a.fecha_lectura).getTime());
        
        this.dataSource.data = allData;
        this.calculateStatistics();
        this.isLoading = false;
        
        // Reconectar paginador después de cargar datos
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
            console.log('Paginador reconectado:', {
              totalItems: this.dataSource.data.length,
              pageSize: this.paginator.pageSize,
              pageIndex: this.paginator.pageIndex
            });
          } else {
            console.warn('Paginador no encontrado');
          }
        }, 100);
        
        console.log('Datos cargados:', {
          total: allData.length,
          mq135: data.mq135?.length || 0,
          mq4: data.mq4?.length || 0,
          mq7: data.mq7?.length || 0
        });
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.snackBar.open('Error cargando datos', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['error-snackbar'] 
        });
        this.isLoading = false;
      }
    });
  }
  
  determinarEstado(valor: number, sensorId: string): 'Bueno' | 'Advertencia' | 'Malo' {
    // Límites basados en la lógica del Arduino
    switch (sensorId) {
      case 'mq135': // Calidad del aire / CO₂ aproximado
        return valor < 400 ? 'Bueno' : (valor < 1000 ? 'Advertencia' : 'Malo');
      case 'mq4': // Metano / gas natural
        return valor < 1000 ? 'Bueno' : (valor < 5000 ? 'Advertencia' : 'Malo');
      case 'mq7': // Monóxido de carbono
        return valor < 9 ? 'Bueno' : (valor < 35 ? 'Advertencia' : 'Malo');
      default:
        return 'Bueno';
    }
  }
  
  calculateStatistics(): void {
    // Siempre usar todos los datos (sin filtrar) para las estadísticas
    const data = this.dataSource.data;
    this.statistics = {
      total: data.length,
      buenos: data.filter(item => item.estado === 'Bueno').length,
      advertencias: data.filter(item => item.estado === 'Advertencia').length,
      malos: data.filter(item => item.estado === 'Malo').length
    };
  }
  
  applyFilter(): void {
    this.searchTerm = this.searchTerm.trim().toLowerCase();
    this.dataSource.filter = Math.random().toString(); // Trigger filterPredicate
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    // No recalcular estadísticas - solo afecta la tabla
  }
  
  applyAdvancedFilter(): void {
    this.dataSource.filter = Math.random().toString(); // Trigger filterPredicate
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    // No recalcular estadísticas - solo afecta la tabla
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSensor = '';
    this.selectedEstado = '';
    this.selectedDateFrom = '';
    this.selectedDateTo = '';
    this.dataSource.filter = '';
    // No recalcular estadísticas - solo afecta la tabla
  }
  
  editItem(item: SensorReading): void {
    this.isEditing = true;
    this.currentItem = { ...item };
  }
  
  saveEdit(): void {
    if (!this.currentItem) return;
    
    this.isLoading = true;
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    
    if (!token) {
      this.snackBar.open('No estás autenticado', 'Cerrar', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
      this.isLoading = false;
      return;
    }
    
    // Actualizar el estado basado en el nuevo valor
    this.currentItem.estado = this.determinarEstado(this.currentItem.valor, this.currentItem.sensor_id);
    
    this.http.put(`http://localhost:8000/lecturas/${this.currentItem.sensor_id}/${this.currentItem.id}`, {
      valor: this.currentItem.valor,
      fecha_lectura: this.currentItem.fecha_lectura
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.snackBar.open('Lectura actualizada correctamente', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['success-snackbar'] 
        });
        this.loadData();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error actualizando lectura:', error);
        this.snackBar.open('Error actualizando lectura', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['error-snackbar'] 
        });
        this.isLoading = false;
      }
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.currentItem = null;
  }
  
  deleteItem(item: SensorReading): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Eliminación',
        message: '¿Estás seguro de que quieres eliminar esta lectura de sensor?',
        itemName: `${item.sensor_nombre} - Valor: ${item.valor} ppm - ${item.fecha_lectura}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete(item);
      }
    });
  }

  private performDelete(item: SensorReading): void {
    this.isLoading = true;
    const token = this.isBrowser ? localStorage.getItem('token') : null;
    
    if (!token) {
      this.snackBar.open('No estás autenticado', 'Cerrar', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
      this.isLoading = false;
      return;
    }
    
    // Convertir sensor_id string a número
    const sensorIdNumber = this.getSensorIdNumber(item.sensor_id);
    
    this.http.delete(`http://localhost:8000/lecturas/${sensorIdNumber}/${item.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.notificationService.showUserSuccess('Lectura eliminada correctamente');
        this.loadData();
      },
      error: (error) => {
        console.error('Error eliminando lectura:', error);
        this.notificationService.showUserError('eliminar lectura', 'Error eliminando lectura');
        this.isLoading = false;
      }
    });
  }
  
  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Bueno': return 'primary';
      case 'Advertencia': return 'accent';
      case 'Malo': return 'warn';
      default: return 'primary';
    }
  }
  
  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'Bueno': return 'check_circle';
      case 'Advertencia': return 'warning';
      case 'Malo': return 'error';
      default: return 'help';
    }
  }
  
  getSensorIdNumber(sensorId: string): number {
    switch (sensorId) {
      case 'mq135': return 1;
      case 'mq4': return 2;
      case 'mq7': return 3;
      default: return 1; // Default a MQ-135
    }
  }

  // Método para mostrar/ocultar filtros
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

}
