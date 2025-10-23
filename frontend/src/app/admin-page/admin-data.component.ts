import { Component, OnInit, AfterViewInit, ViewChild, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { AdminDataService, SensorReading, Statistics } from './admin-data.service';

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
export class AdminDataComponent implements OnInit, AfterViewInit, OnDestroy {
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
  showFilters = false;
  
  // Configuración de paginación con cache
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  private previousPageSize = 10;
  
  statistics: Statistics = {
    total: 0,
    buenos: 0,
    advertencias: 0,
    malos: 0
  };
  
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
  
  isEditing = false;
  currentItem: SensorReading | null = null;
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  
  constructor(
    private adminDataService: AdminDataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  ngOnInit(): void {
    // Cargar configuración de paginación desde cache
    this.loadPageSizeFromCache();
    this.previousPageSize = this.pageSize; // Inicializar el valor anterior
    
    // Suscribirse a los datos cacheados
    this.adminDataService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.dataSource.data = data;
        console.log('📊 Datos actualizados en componente:', data.length);
      });
    
    // Suscribirse a las estadísticas
    this.adminDataService.statistics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.statistics = stats;
      });
    
    // Cargar datos (usará caché si está disponible)
    this.loadData();
  }
  
  ngAfterViewInit(): void {
    // Configurar paginador y sort con delay para asegurar que el DOM está listo
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
      
      // Configurar filtro personalizado
      this.setupCustomFilter();
    }, 0);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga datos con indicador de carga
   */
  loadData(forceReload = false): void {
    // Si ya hay datos en caché y no se fuerza recarga, no mostrar spinner
    if (!forceReload && this.adminDataService.hasCachedData()) {
      console.log('⚡ Carga rápida desde caché');
      return;
    }
    
    this.isLoading = true;
    
    this.adminDataService.loadData(forceReload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          
          // Reconectar paginador después de cargar
          setTimeout(() => {
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
          }, 100);
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
  
  /**
   * Configura el filtro personalizado
   */
  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (item: SensorReading, filter: string) => {
      const sensorMatch = this.selectedSensor === '' || item.sensor_id === this.selectedSensor;
      const estadoMatch = this.selectedEstado === '' || item.estado === this.selectedEstado;
      
      const fechaDesdeMatch = this.selectedDateFrom === '' || 
        new Date(item.fecha_lectura) >= new Date(this.selectedDateFrom);
      
      const fechaHastaMatch = this.selectedDateTo === '' || 
        new Date(item.fecha_lectura) <= new Date(this.selectedDateTo);
      
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
  
  applyFilter(): void {
    this.searchTerm = this.searchTerm.trim().toLowerCase();
    this.dataSource.filter = Math.random().toString();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  applyAdvancedFilter(): void {
    this.dataSource.filter = Math.random().toString();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSensor = '';
    this.selectedEstado = '';
    this.selectedDateFrom = '';
    this.selectedDateTo = '';
    this.dataSource.filter = '';
  }
  
  editItem(item: SensorReading): void {
    this.isEditing = true;
    this.currentItem = { ...item };
  }
  
  saveEdit(): void {
    if (!this.currentItem) return;
    
    this.isLoading = true;
    
    this.adminDataService.updateReading(
      this.currentItem.sensor_id,
      this.currentItem.id,
      this.currentItem.valor,
      this.currentItem.fecha_lectura
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.snackBar.open('Lectura actualizada correctamente', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['success-snackbar'] 
        });
        this.loadData(true); // Forzar recarga
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
    const sensorIdNumber = this.getSensorIdNumber(item.sensor_id);
    
    this.adminDataService.deleteReading(sensorIdNumber, item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showUserSuccess('Lectura eliminada correctamente');
          this.loadData(true); // Forzar recarga
        },
        error: (error) => {
          console.error('Error eliminando lectura:', error);
          this.notificationService.showUserError('eliminar lectura', 'Error eliminando lectura');
          this.isLoading = false;
        }
      });
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
      default: return 1;
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  /**
   * Método para refrescar manualmente los datos
   */
  refreshData(): void {
    this.loadData(true);
  }
  
  /**
   * Carga la configuración de pageSize desde el cache de sesión
   */
  private loadPageSizeFromCache(): void {
    if (this.isBrowser) {
      try {
        const cachedPageSize = sessionStorage.getItem('admin-data-pageSize');
        if (cachedPageSize) {
          const parsedSize = parseInt(cachedPageSize, 10);
          if (this.pageSizeOptions.includes(parsedSize)) {
            this.pageSize = parsedSize;
          }
        }
      } catch (error) {
        console.warn('Error cargando pageSize desde cache:', error);
      }
    }
  }
  
  /**
   * Guarda la configuración de pageSize en el cache de sesión
   */
  private savePageSizeToCache(): void {
    if (this.isBrowser) {
      try {
        sessionStorage.setItem('admin-data-pageSize', this.pageSize.toString());
      } catch (error) {
        console.warn('Error guardando pageSize en cache:', error);
      }
    }
  }
  
  /**
   * Maneja el cambio de página o pageSize del paginador
   */
  onPageChange(event: PageEvent): void {
    // Solo guardar en cache si realmente cambió el pageSize
    if (event.pageSize !== this.previousPageSize) {
      this.pageSize = event.pageSize;
      this.previousPageSize = event.pageSize;
      this.savePageSizeToCache();
      console.log('💾 PageSize cambiado y guardado en cache:', event.pageSize);
    }
    
    // Forzar actualización del paginador
    if (this.paginator) {
      this.paginator.pageSize = event.pageSize;
      this.paginator.pageIndex = 0; // Volver a la primera página
    }
  }
}