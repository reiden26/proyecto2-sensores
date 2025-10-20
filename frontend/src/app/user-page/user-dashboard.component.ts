import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SensorDashboardComponent } from './sensor-dashboard.component';
import { SensorComparisonChartComponent } from './sensor-comparison-chart.component';
import { UsuarioService } from '../services/usuario.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    SensorDashboardComponent,
    SensorComparisonChartComponent
  ],
  template: `
    <div class="user-dashboard-content">
      <!-- Welcome Section -->
      <mat-card class="welcome-card">
        <mat-card-content>
          <div class="welcome-content">
            <div class="welcome-text">
              <h1>¡Bienvenido de vuelta!</h1>
              <p>Monitorea tus sensores en tiempo real y mantén el control de tu entorno</p>
            </div>
            <div class="welcome-icon">
              <mat-icon>eco</mat-icon>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>sensors</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ activeSensors }}</h3>
                <p>Sensores Activos</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ dataPoints }}</h3>
                <p>Datos Hoy</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ lastUpdate }}</h3>
                <p>Última Actualización</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-info">
                <h3>{{ systemStatus }}</h3>
                <p>Estado del Sistema</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Individual Sensor Charts -->
      <mat-card class="sensor-charts-card">
        <mat-card-content>
          <sensor-dashboard></sensor-dashboard>
        </mat-card-content>
      </mat-card>

      <!-- Sensor Comparison Chart -->
      <mat-card class="comparison-chart-card">
        <mat-card-content>
          <app-sensor-comparison-chart></app-sensor-comparison-chart>
        </mat-card-content>
      </mat-card>

      <!-- Quick Actions -->
      <mat-card class="actions-card">
        <mat-card-content>
          <div class="actions-grid">
            <button mat-raised-button color="primary" class="action-button" routerLink="/usuario/sensores">
              <mat-icon>sensors</mat-icon>
              <span>Ver Mis Sensores</span>
            </button>
            <button mat-raised-button color="accent" class="action-button" routerLink="/usuario/datos">
              <mat-icon>analytics</mat-icon>
              <span>Analizar Datos</span>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  activeSensors = 0;
  dataPoints = 0;
  lastUpdate = 'N/A';
  systemStatus = 'Normal';
  userId!: number;
  private apiUrl = environment.apiBaseUrl;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    console.log('🚀 UserDashboardComponent initialized');
    
    // Obtener el ID del usuario actual
    const currentUser = this.usuarioService.getCurrentUser();
    console.log('Current user:', currentUser); // Debug
    
    if (currentUser && (currentUser.user_id || currentUser.id)) {
      this.userId = currentUser.user_id || currentUser.id;
      console.log('✅ User ID set:', this.userId); // Debug
      this.loadDashboardStats();
    } else {
      console.log('⏳ User not available yet, subscribing to user changes...');
      // Suscribirse a cambios en el usuario
      this.usuarioService.currentUser$.subscribe(user => {
        if (user && (user.user_id || user.id)) {
          this.userId = user.user_id || user.id;
          console.log('✅ User ID set from subscription:', this.userId);
          this.loadDashboardStats();
        }
      });
    }
    
    // Cargar estadísticas inmediatamente (sin esperar userId)
    console.log('🔄 Loading dashboard stats immediately...');
    this.loadDashboardStats();
    
    // Actualizar datos cada 30 segundos
    setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard stats...');
      this.loadDashboardStats();
    }, 30000);
  }

  private async loadDashboardStats() {
    console.log('🔄 Loading dashboard stats...');
    try {
      console.log('1. Loading active sensors count...');
      await this.loadActiveSensorsCount();
      
      console.log('2. Loading today data count...');
      await this.loadTodayDataCount();
      
      console.log('3. Loading last update time...');
      await this.loadLastUpdateTime();
      
      console.log('4. Updating system status...');
      this.updateSystemStatus();
      
      console.log('✅ Dashboard stats loaded:', {
        activeSensors: this.activeSensors,
        dataPoints: this.dataPoints,
        lastUpdate: this.lastUpdate,
        systemStatus: this.systemStatus
      });
    } catch (error) {
      console.error('❌ Error al cargar estadísticas del dashboard:', error);
    }
  }

  private async loadActiveSensorsCount() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found for active sensors');
      return;
    }

    try {
      console.log('Fetching active sensors from:', `${this.apiUrl}/sensores/activos`);
      const response = await fetch(`${this.apiUrl}/sensores/activos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Active sensors response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Active sensors data:', data);
        this.activeSensors = (data.mq135_activo ? 1 : 0) + 
                           (data.mq4_activo ? 1 : 0) + 
                           (data.mq7_activo ? 1 : 0);
        console.log(`✅ Sensores activos: ${this.activeSensors}`);
      } else {
        console.error('❌ Error response from active sensors:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al cargar sensores activos:', error);
    }
  }

  private async loadTodayDataCount() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found for today data');
      return;
    }

    try {
      console.log('Fetching today data from:', `${this.apiUrl}/lecturas/me?limit=1000`);
      const response = await fetch(`${this.apiUrl}/lecturas/me?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Today data response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Today data response:', data);
        const today = new Date().toDateString();
        console.log('Today date string:', today);
        
        let todayCount = 0;
        ['mq135', 'mq4', 'mq7'].forEach(sensorId => {
          if (data[sensorId]) {
            const sensorTodayCount = data[sensorId].filter((reading: any) => 
              new Date(reading.creado_en).toDateString() === today
            ).length;
            console.log(`${sensorId} today count:`, sensorTodayCount);
            todayCount += sensorTodayCount;
          }
        });
        
        this.dataPoints = todayCount;
        console.log(`✅ Datos de hoy: ${this.dataPoints}`);
      } else {
        console.error('❌ Error response from today data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de hoy:', error);
    }
  }

  private async loadLastUpdateTime() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${this.apiUrl}/lecturas/me?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let latestTime: Date | null = null;
        
        ['mq135', 'mq4', 'mq7'].forEach(sensorId => {
          if (data[sensorId] && data[sensorId].length > 0) {
            const readingTime = new Date(data[sensorId][0].creado_en);
            if (!latestTime || readingTime > latestTime) {
              latestTime = readingTime;
            }
          }
        });
        
        if (latestTime) {
          const now = new Date();
          const diffMs = now.getTime() - (latestTime as Date).getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          
          if (diffMins < 1) {
            this.lastUpdate = 'Ahora';
          } else if (diffMins < 60) {
            this.lastUpdate = `${diffMins} min`;
          } else {
            const diffHours = Math.floor(diffMins / 60);
            this.lastUpdate = `${diffHours}h`;
          }
        } else {
          this.lastUpdate = 'N/A';
        }
        
        console.log(`Última actualización: ${this.lastUpdate}`);
      }
    } catch (error) {
      console.error('Error al cargar última actualización:', error);
    }
  }

  private updateSystemStatus() {
    if (this.activeSensors === 0) {
      this.systemStatus = 'Inactivo';
    } else if (this.activeSensors === 3) {
      this.systemStatus = 'Normal';
    } else {
      this.systemStatus = 'Parcial';
    }
  }

}

