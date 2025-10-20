import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../environments/environment';

interface DataItem {
  id: number;
  sensor: string;
  icono: string;
  valor: number;
  unidad: string;
  estado: string;
  estadoIcono: string;
  fecha: string;
  sensor_codigo: string;
}

@Component({
  selector: 'user-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSelectModule, MatChipsModule],
  templateUrl: './user-data-table.component.html',
  styleUrls: ['./user-data-table.component.css']
})
export class UserDataTableComponent implements OnInit, AfterViewInit {
  // Datos reales de la base de datos
  dataItems: DataItem[] = [];
  displayedColumns: string[] = ['id', 'sensor', 'valor', 'estado', 'fecha'];
  dataSource = new MatTableDataSource<DataItem>(this.dataItems);
  searchTerm = '';
  isLoading = false;
  isSearchActive = false;
  private apiUrl = environment.apiBaseUrl;

  // Filtros avanzados
  filtroSensor = '';
  filtroEstado = '';
  sensoresDisponibles = [
    { value: '', label: 'Todos los sensores' },
    { value: 'MQ-135', label: 'MQ-135 (Calidad del aire)' },
    { value: 'MQ-4', label: 'MQ-4 (Metano)' },
    { value: 'MQ-7', label: 'MQ-7 (Monóxido de carbono)' }
  ];
  estadosDisponibles = [
    { value: '', label: 'Todos los estados' },
    { value: 'Bueno', label: 'Bueno' },
    { value: 'Advertencia', label: 'Advertencia' },
    { value: 'Malo', label: 'Malo' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.cargarDatosSensores();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar ordenamiento personalizado para campos numéricos
    this.dataSource.sortingDataAccessor = (item: DataItem, property: string) => {
      console.log('Sorting accessor called for property:', property, 'value:', item[property as keyof DataItem]);
      
      switch (property) {
        case 'id':
          const idValue = +item.id;
          console.log('ID sorting value:', idValue);
          return idValue;
        case 'valor':
          const valorValue = +item.valor;
          console.log('Valor sorting value:', valorValue);
          return valorValue;
        case 'fecha':
          const fechaValue = new Date(item.fecha).getTime();
          console.log('Fecha sorting value:', fechaValue);
          return fechaValue;
        case 'sensor':
          return item.sensor.toLowerCase();
        case 'estado':
          return item.estado.toLowerCase();
        default:
          return item[property as keyof DataItem] as string;
      }
    };

    // Filtro personalizado simplificado
    this.dataSource.filterPredicate = (data: DataItem, filter: string) => {
      // Filtro por sensor
      const sensorMatch = this.filtroSensor === '' || data.sensor === this.filtroSensor;
      
      // Filtro por estado
      const estadoMatch = this.filtroEstado === '' || data.estado === this.filtroEstado;
      
      // Filtro de búsqueda general
      const term = this.searchTerm.trim().toLowerCase();
      const searchMatch = this.searchTerm === '' || (
        data.sensor.toLowerCase().includes(term) ||
        data.valor.toString().includes(term) ||
        data.unidad.toLowerCase().includes(term) ||
        data.estado.toLowerCase().includes(term) ||
        data.id.toString().includes(term) ||
        data.fecha.toLowerCase().includes(term)
      );
      
      return sensorMatch && estadoMatch && searchMatch;
    };
  }

  applyFilter(value: string): void {
    this.searchTerm = value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  // Aplicar filtro por sensor
  aplicarFiltroSensor() {
    console.log('Aplicando filtro sensor:', this.filtroSensor);
    this.dataSource.filter = Math.random().toString();
  }

  // Aplicar filtro por estado
  aplicarFiltroEstado() {
    console.log('Aplicando filtro estado:', this.filtroEstado);
    this.dataSource.filter = Math.random().toString();
  }

  // Limpiar todos los filtros
  limpiarFiltros() {
    this.searchTerm = '';
    this.filtroSensor = '';
    this.filtroEstado = '';
    this.isSearchActive = false;
    this.dataSource.filter = '';
    console.log('Filtros limpiados, datos restaurados:', this.dataItems.length);
  }

  // Activar búsqueda cuando se hace focus
  activateSearch() {
    this.isSearchActive = true;
  }

  // Desactivar búsqueda cuando se pierde focus (solo si está vacío)
  deactivateSearch() {
    if (this.searchTerm.trim() === '') {
      this.isSearchActive = false;
    }
  }

  // Cargar datos reales de los sensores
  async cargarDatosSensores() {
    this.isLoading = true;
    try {
      // Cargar todos los registros disponibles
      const response = await fetch(`${this.apiUrl}/lecturas/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const lecturas = await response.json();
        this.procesarDatosSensores(lecturas);
        this.dataSource.data = this.dataItems;
        
        // Configurar paginador y ordenamiento después de cargar datos
        setTimeout(() => {
        // Asegurar que el paginador y sort estén conectados
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        
        // Configurar ordenamiento por defecto
        setTimeout(() => {
          if (this.dataSource.sort) {
            this.dataSource.sort.sort({ id: 'fecha', start: 'desc', disableClear: false });
          }
        }, 100);
        
        // Aplicar filtros si están activos
        if (this.tieneFiltrosActivos()) {
          this.dataSource.filter = Math.random().toString();
        }
        }, 100);
        
        console.log('Total de datos cargados:', this.dataItems.length);
        console.log('Datos por sensor:', {
          mq135: this.dataItems.filter(d => d.sensor === 'MQ-135').length,
          mq4: this.dataItems.filter(d => d.sensor === 'MQ-4').length,
          mq7: this.dataItems.filter(d => d.sensor === 'MQ-7').length
        });
      } else {
        this.snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.snackBar.open('Error de conexión', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  // Procesar datos de las 3 tablas de sensores
  private procesarDatosSensores(lecturas: any) {
    this.dataItems = [];
    
    // Procesar MQ-135
    if (lecturas.mq135 && lecturas.mq135.length > 0) {
      lecturas.mq135.forEach((lectura: any) => {
        this.dataItems.push({
          id: lectura.id.toString(), // Asegurar que sea string
          sensor: 'MQ-135',
          icono: 'air',
          valor: Math.round(lectura.valor * 100) / 100, // Redondear a 2 decimales
          unidad: 'ppm',
          estado: this.mapearEstado(lectura.estado),
          estadoIcono: this.mapearIconoEstado(lectura.estado),
          fecha: new Date(lectura.creado_en).toISOString(), // Convertir a formato estándar
          sensor_codigo: 'mq135'
        });
      });
    }

    // Procesar MQ-4
    if (lecturas.mq4 && lecturas.mq4.length > 0) {
      lecturas.mq4.forEach((lectura: any) => {
        this.dataItems.push({
          id: lectura.id.toString(), // Asegurar que sea string
          sensor: 'MQ-4',
          icono: 'local_fire_department',
          valor: Math.round(lectura.valor * 100) / 100,
          unidad: 'ppm',
          estado: this.mapearEstado(lectura.estado),
          estadoIcono: this.mapearIconoEstado(lectura.estado),
          fecha: new Date(lectura.creado_en).toISOString(),
          sensor_codigo: 'mq4'
        });
      });
    }

    // Procesar MQ-7
    if (lecturas.mq7 && lecturas.mq7.length > 0) {
      lecturas.mq7.forEach((lectura: any) => {
        this.dataItems.push({
          id: lectura.id.toString(), // Asegurar que sea string
          sensor: 'MQ-7',
          icono: 'warning',
          valor: Math.round(lectura.valor * 100) / 100,
          unidad: 'ppm',
          estado: this.mapearEstado(lectura.estado),
          estadoIcono: this.mapearIconoEstado(lectura.estado),
          fecha: new Date(lectura.creado_en).toISOString(),
          sensor_codigo: 'mq7'
        });
      });
    }

    // Ordenar por fecha (más reciente primero) - esto se manejará por el sort de la tabla
    // this.dataItems.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    console.log('Datos procesados:', this.dataItems.length, 'registros');
    if (this.dataItems.length > 0) {
      console.log('Primer registro:', this.dataItems[0]);
      console.log('Tipos de datos:', {
        id: typeof this.dataItems[0].id,
        valor: typeof this.dataItems[0].valor,
        fecha: typeof this.dataItems[0].fecha
      });
    }
  }

  // Mapear estado del backend al frontend
  private mapearEstado(estado: string): string {
    switch (estado) {
      case 'bueno': return 'Bueno';
      case 'advertencia': return 'Advertencia';
      case 'malo': return 'Malo';
      default: return 'Desconocido';
    }
  }

  // Mapear icono según el estado
  private mapearIconoEstado(estado: string): string {
    switch (estado) {
      case 'bueno': return 'check_circle';
      case 'advertencia': return 'warning';
      case 'malo': return 'error';
      default: return 'help';
    }
  }

  // Verificar si hay filtros activos
  private tieneFiltrosActivos(): boolean {
    return this.filtroSensor !== '' || this.filtroEstado !== '' || this.searchTerm !== '';
  }

  // Actualizar datos
}



