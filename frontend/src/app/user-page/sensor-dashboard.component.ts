import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

declare var Chart: any;

@Component({
  selector: 'sensor-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonToggleModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <mat-button-toggle-group
          [value]="selectedTimeFilter"
          (change)="selectTimeFilter($event.value)"
          name="timeRange"
          aria-label="Filtro de tiempo"
        >
          <mat-button-toggle *ngFor="let filter of timeFilters" [value]="filter.value">
            {{ filter.label }}
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="charts-grid">
        <mat-card class="chart-card" *ngFor="let sensor of sensors">
          <div class="chart-header">
            <div class="sensor-title">
              <mat-icon>{{ sensor.icon }}</mat-icon>
              <h3>{{ sensor.name }}</h3>
            </div>
            <span class="sensor-status" [class.active]="sensor.active">
              {{ sensor.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <div class="chart-container">
            <canvas [id]="'chart-' + sensor.id"></canvas>
          </div>
          <div class="chart-info">
            <div class="current-value">
              <span class="value">{{ sensor.currentValue || '--' }}</span>
              <span class="unit">{{ sensor.unit }}</span>
            </div>
            <div class="last-update">
              Última actualización: {{ sensor.lastUpdate || 'N/A' }}
            </div>
          </div>
        </mat-card>
      </div>

    </div>
  `,
  styleUrls: ['./sensor-dashboard.component.css']
})
export class SensorDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  sensors = [
    { id: 'mq135', name: 'MQ-135', unit: 'ppm', active: false, currentValue: null as number | null, lastUpdate: null as string | null, icon: 'air' },
    { id: 'mq7', name: 'MQ-7', unit: 'ppm', active: false, currentValue: null as number | null, lastUpdate: null as string | null, icon: 'smoke_free' },
    { id: 'mq4', name: 'MQ-4', unit: 'ppm', active: false, currentValue: null as number | null, lastUpdate: null as string | null, icon: 'gas_meter' }
  ];

  timeFilters = [
    { value: '1h', label: 'Última Hora' },
    { value: '24h', label: 'Último Día' },
    { value: '7d', label: 'Última Semana' },
    { value: '30d', label: 'Último Mes' }
  ];

  selectedTimeFilter = '24h';
  isLoading = false;
  charts: { [key: string]: any } = {};
  
  // Estadísticas del dashboard
  activeSensorsCount = 0;
  todayDataCount = 0;
  lastUpdateTime = 'N/A';
  systemStatus = 'Normal';
  
  private isBrowser: boolean;
  private refreshInterval: any;
  private apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Actualizar datos cada 10 segundos
      this.refreshInterval = setInterval(() => {
        console.log('🔄 Actualización automática del dashboard...');
        this.loadSensorData();
      }, 10000);
      console.log('✅ Intervalo de actualización automática configurado (cada 10 segundos)');
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      // Esperar un poco para que el DOM esté completamente renderizado
      setTimeout(() => {
        this.initializeCharts();
        this.loadSensorData();
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    // Destruir gráficos
    Object.values(this.charts).forEach((chart: any) => {
      if (chart) chart.destroy();
    });
  }

  selectTimeFilter(filter: string) {
    this.selectedTimeFilter = filter;
    this.loadSensorData();
  }

  refreshData() {
    this.loadSensorData();
  }

  private initializeCharts() {
    console.log('Inicializando gráficos...');
    console.log('Chart.js disponible:', typeof Chart !== 'undefined');
    console.log('Sensores:', this.sensors);
    
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
      console.error('Chart.js no está disponible');
      return;
    }

    // Verificar si ya hay gráficos inicializados
    if (Object.keys(this.charts).length > 0) {
      console.log('Gráficos ya inicializados, saltando...');
      return;
    }

    // Destruir gráficos existentes primero
    Object.values(this.charts).forEach((chart: any) => {
      if (chart) {
        console.log('Destruyendo gráfico existente');
        chart.destroy();
      }
    });
    this.charts = {};

    this.sensors.forEach(sensor => {
      const canvasId = 'chart-' + sensor.id;
      console.log(`Buscando canvas con ID: ${canvasId}`);
      
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      console.log(`Canvas encontrado para sensor ${sensor.id}:`, canvas);
      
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            const chart = new Chart(ctx, {
              type: 'line',
              data: {
                labels: [],
                datasets: [{
                  label: sensor.name,
                  data: [],
                  borderColor: this.getSensorColor(sensor.id),
                  backgroundColor: this.getSensorColor(sensor.id, 0.1),
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: '#333333'
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: '#333333'
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index'
                }
              }
            });
            this.charts[sensor.id] = chart;
            console.log(`✅ Gráfico creado exitosamente para sensor ${sensor.id}`);
          } catch (error) {
            console.error(`❌ Error creando gráfico para sensor ${sensor.id}:`, error);
          }
        } else {
          console.error(`❌ No se pudo obtener contexto 2D para sensor ${sensor.id}`);
        }
      } else {
        console.error(`❌ Canvas no encontrado para sensor ${sensor.id}`);
        // Listar todos los elementos con ID que contengan 'chart'
        const allElements = document.querySelectorAll('[id*="chart"]');
        console.log('Elementos con ID que contienen "chart":', allElements);
      }
    });
  }

  private async loadSensorData() {
    this.isLoading = true;
    
    try {
      console.log('📊 Cargando datos del dashboard...');
      
      // Cargar estado de sensores activos
      await this.loadActiveSensors();
      
      // Cargar datos de lecturas para todos los sensores (para mostrar datos históricos)
      await this.loadAllSensorReadings();
      
      console.log('✅ Datos del dashboard cargados exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar datos de sensores:', error);
      this.snackBar.open('Error al cargar datos de sensores', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  private async loadActiveSensors() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token de autenticación');
      return;
    }

    try {
      console.log('Cargando estado de sensores activos...');
      const response = await fetch(`${this.apiUrl}/sensores/activos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del endpoint sensores/activos:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Estado de sensores recibido:', data);
        
        this.sensors.forEach(sensor => {
          if (sensor.id === 'mq135') {
            sensor.active = data.mq135_activo || false;
            console.log(`MQ-135 activo: ${sensor.active}`);
          } else if (sensor.id === 'mq4') {
            sensor.active = data.mq4_activo || false;
            console.log(`MQ-4 activo: ${sensor.active}`);
          } else if (sensor.id === 'mq7') {
            sensor.active = data.mq7_activo || false;
            console.log(`MQ-7 activo: ${sensor.active}`);
          }
        });
      } else {
        console.error('Error en respuesta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar estado de sensores:', error);
    }
  }

  private async loadAllSensorReadings() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const limit = this.getLimitForTimeFilter();
      console.log(`Cargando datos de lecturas con límite: ${limit}`);
      
      const response = await fetch(`${this.apiUrl}/lecturas/me?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del endpoint lecturas/me:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Datos recibidos del backend:', data);
        
        // Procesar datos para cada sensor
        this.sensors.forEach(sensor => {
          const sensorData = this.filterDataBySensor(data, sensor.id);
          console.log(`Datos del sensor ${sensor.id}:`, sensorData);
          
          if (sensorData.length > 0) {
            const chartData = this.processDataForChart(sensorData, sensor.id);
            this.updateChart(sensor.id, chartData);
            this.updateSensorInfo(sensor.id, chartData);
            console.log(`✅ Gráfica actualizada para ${sensor.id} con ${sensorData.length} datos`);
          } else {
            console.log(`⚠️ No hay datos para el sensor ${sensor.id}`);
          }
        });
      } else {
        console.error('Error en respuesta del endpoint lecturas/me:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar lecturas de sensores:', error);
    }
  }

  private getLimitForTimeFilter(): number {
    switch (this.selectedTimeFilter) {
      case '1h': return 12; // 12 lecturas en 1 hora (cada 5 min)
      case '24h': return 24; // 24 lecturas en 1 día (cada hora)
      case '7d': return 28; // 28 lecturas en 1 semana (4 por día)
      case '30d': return 30; // 30 lecturas en 1 mes (1 por día)
      default: return 24;
    }
  }

  private filterDataBySensor(data: any, sensorId: string): any[] {
    // El backend devuelve: { "mq135": [...], "mq4": [...], "mq7": [...] }
    return data[sensorId] || [];
  }

  private processDataForChart(sensorData: any[], sensorId: string): { labels: string[], values: number[] } {
    const labels: string[] = [];
    const values: number[] = [];
    
    // Ordenar por fecha (más reciente primero)
    const sortedData = sensorData.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
    
    // Tomar solo los datos necesarios según el filtro de tiempo
    const limit = this.getLimitForTimeFilter();
    const limitedData = sortedData.slice(0, limit).reverse();
    
    limitedData.forEach(reading => {
      const date = new Date(reading.creado_en);
      labels.push(this.formatTime(date, this.selectedTimeFilter));
      values.push(reading.valor);
    });
    
    return { labels, values };
  }

  private generateMockData(sensorId: string, timeFilter: string): { labels: string[], values: number[] } {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];
    
    let points = 24; // Por defecto 24 puntos
    let interval = 60; // 60 minutos por defecto
    
    switch (timeFilter) {
      case '1h':
        points = 12;
        interval = 5; // 5 minutos
        break;
      case '24h':
        points = 24;
        interval = 60; // 1 hora
        break;
      case '7d':
        points = 7;
        interval = 24 * 60; // 1 día
        break;
      case '30d':
        points = 30;
        interval = 24 * 60; // 1 día
        break;
    }

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * interval * 60 * 1000));
      labels.push(this.formatTime(time, timeFilter));
      
      // Generar valores realistas según el tipo de sensor
      let value = this.generateRealisticValue(sensorId);
      values.push(value);
    }

    return { labels, values };
  }

  private generateRealisticValue(sensorId: string): number {
    switch (sensorId) {
      case 'mq135': // MQ-135 - Calidad del aire (gases tóxicos)
        return Math.round((Math.random() * 300 + 100) * 10) / 10; // 100-400 ppm
      case 'mq7': // MQ-7 - Monóxido de carbono (CO)
        return Math.round((Math.random() * 20 + 1) * 10) / 10; // 1-21 ppm
      case 'mq4': // MQ-4 - Gas metano (CH₄)
        return Math.round((Math.random() * 10 + 0.5) * 10) / 10; // 0.5-10.5 ppm
      default:
        return Math.round(Math.random() * 100);
    }
  }

  private updateChart(sensorId: string, data: any) {
    const chart = this.charts[sensorId];
    if (chart) {
      // Solo actualizar si hay datos nuevos
      if (data.labels && data.values && data.labels.length > 0) {
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.update('none');
        console.log(`📈 Gráfica actualizada para ${sensorId} con ${data.values.length} puntos`);
      }
    } else {
      console.warn(`⚠️ No se encontró gráfica para el sensor ${sensorId}`);
    }
  }

  private updateSensorInfo(sensorId: string, data: any) {
    const sensor = this.sensors.find(s => s.id === sensorId);
    if (sensor && data.values && data.values.length > 0) {
      const newValue = data.values[data.values.length - 1];
      const newTime = new Date().toLocaleTimeString();
      
      // Solo actualizar si el valor cambió
      if (sensor.currentValue !== newValue) {
        sensor.currentValue = newValue;
        sensor.lastUpdate = newTime;
        console.log(`🔄 Sensor ${sensorId} actualizado: ${newValue} ppm a las ${newTime}`);
      }
    }
  }

  private formatTime(date: Date, timeFilter: string): string {
    switch (timeFilter) {
      case '1h':
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      case '7d':
      case '30d':
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      default:
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
  }

  private getSensorColor(sensorId: string, alpha: number = 1): string {
    const colors: { [key: string]: string } = {
      'mq135': `rgba(255, 99, 132, ${alpha})`,   // Rojo - MQ-135 (Calidad del aire)
      'mq7': `rgba(255, 165, 0, ${alpha})`,      // Naranja - MQ-7 (Monóxido de carbono)
      'mq4': `rgba(54, 162, 235, ${alpha})`      // Azul - MQ-4 (Gas metano)
    };
    return colors[sensorId] || `rgba(128, 128, 128, ${alpha})`;
  }
}
