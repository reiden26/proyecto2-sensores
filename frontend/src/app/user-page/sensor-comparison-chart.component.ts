import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from '../services/usuario.service';

declare var Chart: any;

interface SensorReading {
  id: number;
  valor: number;
  estado: string;
  creado_en: string;
}

interface SensorDataResponse {
  mq135: SensorReading[];
  mq4: SensorReading[];
  mq7: SensorReading[];
}

@Component({
  selector: 'app-sensor-comparison-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="comparison-chart-container">
      <div class="chart-header">
        <h3>
          <mat-icon class="header-icon">compare_arrows</mat-icon>
          Comparación de Sensores
        </h3>
        <div class="chart-controls">
          <mat-form-field appearance="outline" class="time-filter">
            <mat-label>Período</mat-label>
            <mat-select [(value)]="selectedTimeFilter" (selectionChange)="onTimeFilterChange()">
              <mat-option value="1h">Última hora</mat-option>
              <mat-option value="6h">Últimas 6 horas</mat-option>
              <mat-option value="24h">Últimas 24 horas</mat-option>
              <mat-option value="7d">Últimos 7 días</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
      
      <div class="chart-content">
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos...</p>
        </div>
        
        <div *ngIf="!loading && !hasData" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No hay datos disponibles para el período seleccionado</p>
        </div>
        
        <div *ngIf="!loading && hasData" class="chart-wrapper">
          <div class="area-chart-container">
            <canvas #areaChartCanvas></canvas>
          </div>
          
          <!-- Legend -->
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-color mq135"></div>
              <span>MQ135 (CO₂)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color mq4"></div>
              <span>MQ4 (CH₄)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color mq7"></div>
              <span>MQ7 (CO)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./sensor-comparison-chart.component.css']
})
export class SensorComparisonChartComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('areaChartCanvas', { static: false }) areaChartCanvas!: ElementRef;
  
  userId!: number;
  selectedTimeFilter = '1h';
  loading = false;
  hasData = false;
  sensorData: SensorDataResponse = { mq135: [], mq4: [], mq7: [] };
  private dataUpdateInterval: any;
  private areaChart: any;

  constructor(private usuarioService: UsuarioService) {}

  private getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }

    try {
      // Decodificar el token JWT para obtener el userId
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = payload.user_id || payload.id || payload.sub;
      console.log('✅ UserId extracted from token:', this.userId);
      
      if (this.userId) {
        this.loadData();
        this.startDataUpdates();
      } else {
        console.error('❌ No userId found in token payload');
      }
    } catch (error) {
      console.error('❌ Error decoding token:', error);
    }
  }

  ngOnInit() {
    console.log('🚀 SensorComparisonChartComponent initialized');
    console.log('User ID received:', this.userId);
    console.log('Selected time filter:', this.selectedTimeFilter);
    
    // Obtener userId del token JWT como hace sensor-dashboard
    this.getUserIdFromToken();
  }

  ngAfterViewInit() {
    // Esperar un poco para que el canvas esté disponible
    setTimeout(() => {
      if (this.hasData) {
        this.createAreaChart();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    // El userId se obtiene del token, no de los cambios del input
    // Este método se mantiene por compatibilidad pero no es necesario
  }

  ngOnDestroy() {
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
    }
    if (this.areaChart) {
      this.areaChart.destroy();
    }
  }

  private createAreaChart() {
    if (!this.areaChartCanvas || !this.hasData) {
      console.log('❌ Canvas not available or no data');
      return;
    }

    // Destruir gráfico existente
    if (this.areaChart) {
      this.areaChart.destroy();
    }

    const ctx = this.areaChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ Could not get canvas context');
      return;
    }

    // Preparar datos para el gráfico
    const chartData = this.prepareChartData();
    
    // Calcular el rango dinámico del eje Y
    const allValues = [...chartData.mq135, ...chartData.mq4, ...chartData.mq7];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const yMax = Math.ceil(maxValue * 1.2); // 20% más del valor máximo
    const yMin = Math.max(0, Math.floor(minValue * 0.8)); // 20% menos del valor mínimo, pero no menos de 0
    
    this.areaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'MQ135 (CO₂)',
            data: chartData.mq135,
            borderColor: 'rgba(142, 36, 170, 1)',
            backgroundColor: 'rgba(142, 36, 170, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 4
          },
          {
            label: 'MQ4 (CH₄)',
            data: chartData.mq4,
            borderColor: 'rgba(233, 30, 99, 1)',
            backgroundColor: 'rgba(233, 30, 99, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 4
          },
          {
            label: 'MQ7 (CO)',
            data: chartData.mq7,
            borderColor: 'rgba(0, 188, 212, 1)',
            backgroundColor: 'rgba(0, 188, 212, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false // Usamos nuestra propia leyenda
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            callbacks: {
              label: function(context: any) {
                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' ppm';
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Tiempo',
              color: '#666'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Valor (ppm)',
              color: '#666'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            beginAtZero: true,
            min: yMin,
            max: yMax,
            ticks: {
              stepSize: Math.max(0.5, Math.ceil((yMax - yMin) / 10)),
              callback: function(value: any) {
                return value.toFixed(1) + ' ppm';
              }
            }
          }
        }
      }
    });

    console.log('✅ Area chart created successfully');
  }

  private prepareChartData() {
    const allTimestamps = new Set<string>();
    
    // Recopilar todos los timestamps únicos
    [...this.sensorData.mq135, ...this.sensorData.mq4, ...this.sensorData.mq7].forEach(reading => {
      allTimestamps.add(reading.creado_en);
    });

    // Ordenar timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    // Crear mapas para acceso rápido
    const mq135Map = new Map(this.sensorData.mq135.map(r => [r.creado_en, r.valor]));
    const mq4Map = new Map(this.sensorData.mq4.map(r => [r.creado_en, r.valor]));
    const mq7Map = new Map(this.sensorData.mq7.map(r => [r.creado_en, r.valor]));

    // Preparar datos para cada timestamp
    const labels: string[] = [];
    const mq135Data: number[] = [];
    const mq4Data: number[] = [];
    const mq7Data: number[] = [];

    sortedTimestamps.forEach(timestamp => {
      const date = new Date(timestamp);
      labels.push(date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      mq135Data.push(mq135Map.get(timestamp) || 0);
      mq4Data.push(mq4Map.get(timestamp) || 0);
      mq7Data.push(mq7Map.get(timestamp) || 0);
    });

    return {
      labels,
      mq135: mq135Data,
      mq4: mq4Data,
      mq7: mq7Data
    };
  }

  private loadData() {
    if (!this.userId) {
      console.log('❌ No userId available');
      return;
    }

    this.loading = true;
    console.log('🔄 Loading sensor data for user:', this.userId, 'with filter:', this.selectedTimeFilter);

    this.usuarioService.getSensorData(this.userId, this.selectedTimeFilter).subscribe({
      next: (data: SensorDataResponse) => {
        console.log('✅ Data received:', data);
        console.log('MQ135 data:', data.mq135?.length || 0, 'items');
        console.log('MQ4 data:', data.mq4?.length || 0, 'items');
        console.log('MQ7 data:', data.mq7?.length || 0, 'items');
        
        this.sensorData = data;
        this.hasData = data.mq135.length > 0 || data.mq4.length > 0 || data.mq7.length > 0;
        
        console.log('Has data:', this.hasData);
        this.loading = false;
        
        // Crear el gráfico después de cargar los datos
        if (this.hasData) {
          setTimeout(() => {
            this.createAreaChart();
          }, 100);
        }
      },
      error: (error) => {
        console.error('❌ Error loading data:', error);
        this.loading = false;
      }
    });
  }

  private startDataUpdates() {
    // Actualizar datos cada 30 segundos
    this.dataUpdateInterval = setInterval(() => {
      this.loadData();
    }, 30000);
  }

  onTimeFilterChange() {
    this.loadData();
  }
}