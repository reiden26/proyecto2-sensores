import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-dashboard-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard-panel.component.html',
  styleUrls: ['./admin-dashboard-panel.component.css']
})
export class AdminDashboardPanelComponent implements OnInit {
  // Estadísticas del sistema
  totalUsers: number = 0;
  totalSensors: number = 0;
  totalDataPoints: number = 0;
  activeNotifications: number = 0;
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    this.http.get(`${environment.apiBaseUrl}/admin/dashboard/stats`, { headers })
      .subscribe({
        next: (data: any) => {
          this.totalUsers = data.total_users || 0;
          this.totalSensors = data.total_sensors || 0;
          this.totalDataPoints = data.total_data_points || 0;
          this.activeNotifications = data.active_notifications || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando estadísticas del dashboard:', error);
          this.isLoading = false;
        }
      });
  }

  navigateTo(route: string): void {
    this.router.navigate(['/admin', route]);
  }
}
