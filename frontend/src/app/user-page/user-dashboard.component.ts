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
    // Obtener el ID del usuario actual
    const currentUser = this.usuarioService.getCurrentUser();
    
    if (currentUser && (currentUser.user_id || currentUser.id)) {
      this.userId = currentUser.user_id || currentUser.id;
      this.loadDashboardStats();
    } else {
      // Suscribirse a cambios en el usuario
      this.usuarioService.currentUser$.subscribe(user => {
        if (user && (user.user_id || user.id)) {
          this.userId = user.user_id || user.id;
          this.loadDashboardStats();
        }
      });
    }
    
    // Cargar estadísticas inmediatamente (sin esperar userId)
    this.loadDashboardStats();
    
    // Actualizar datos cada 30 segundos
    setInterval(() => {
      this.loadDashboardStats();
    }, 30000);
  }

  private async loadDashboardStats() {
    try {
      await this.loadActiveSensorsCount();
      await this.loadTodayDataCount();
      await this.loadLastUpdateTime();
      this.updateSystemStatus();
    } catch (error) {
      // Error silencioso
    }
  }

  private async loadActiveSensorsCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${this.apiUrl}/sensores/activos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.activeSensors = (data.mq135_activo ? 1 : 0) + 
                           (data.mq4_activo ? 1 : 0) + 
                           (data.mq7_activo ? 1 : 0);
      }
    } catch (error) {
      // Error silencioso
    }
  }

  private async loadTodayDataCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${this.apiUrl}/lecturas/me?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const today = new Date().toDateString();
        
        let todayCount = 0;
        ['mq135', 'mq4', 'mq7'].forEach(sensorId => {
          if (data[sensorId]) {
            const sensorTodayCount = data[sensorId].filter((reading: any) => 
              new Date(reading.creado_en).toDateString() === today
            ).length;
            todayCount += sensorTodayCount;
          }
        });
        
        this.dataPoints = todayCount;
      }
    } catch (error) {
      // Error silencioso
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
        
      }
    } catch (error) {
      // Error silencioso
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

