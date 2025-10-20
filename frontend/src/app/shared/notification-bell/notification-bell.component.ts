import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <button mat-icon-button 
            [matMenuTriggerFor]="notificationMenu"
            class="notification-bell"
            [matTooltip]="'Notificaciones (' + unreadCount + ')'">
      <mat-icon [matBadge]="unreadCount" 
                [matBadgeHidden]="unreadCount === 0"
                matBadgeColor="warn"
                matBadgeSize="small">
        notifications
      </mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header" [ngClass]="userRole==='admin' ? 'admin-theme' : 'user-theme'">
        <h3>Notificaciones</h3>
        <button mat-icon-button (click)="markAllAsRead()" 
                [disabled]="unreadCount === 0"
                matTooltip="Marcar todas como leídas">
          <mat-icon>done_all</mat-icon>
        </button>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="notification-list">
        <div *ngIf="notifications.length === 0" class="no-notifications">
          <mat-icon>notifications_none</mat-icon>
          <p>No hay notificaciones</p>
        </div>
        
        <div *ngFor="let notification of notifications" 
             class="notification-item"
             [ngClass]="{
               'unread': !notification.read,
               'user-theme': userRole==='usuario',
               'admin-theme': userRole==='admin'
             }"
             [class.unread]="!notification.read"
             (click)="markAsRead(notification)">
          <div class="notification-icon" [class]="notification.type">
            <mat-icon>{{ getNotificationIcon(notification.type) }}</mat-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-meta">
              <mat-chip-set>
                <mat-chip [class]="'sensor-' + notification.sensor">
                  {{ getSensorName(notification.sensor) }}
                </mat-chip>
                <mat-chip class="value-chip">
                  {{ notification.value }} ppm
                </mat-chip>
                <mat-chip *ngIf="userRole === 'admin' && notification.userName" class="user-chip">
                  {{ notification.userName }}
                </mat-chip>
              </mat-chip-set>
              <span class="notification-time">{{ getTimeAgo(notification.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="notification-footer">
        <button mat-button (click)="clearAllNotifications()" 
                [disabled]="notifications.length === 0">
          <mat-icon>clear_all</mat-icon>
          Limpiar todo
        </button>
      </div>
    </mat-menu>
  `,
  styles: [`
    .notification-bell {
      color: white !important;
    }
    
    .notification-menu {
      min-width: 450px;
      max-width: 550px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      color: white;
    }

    .notification-header.user-theme {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
    }

    .notification-header.admin-theme {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    }
    
    .notification-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .notification-header button {
      color: white !important;
      transition: all 0.3s ease;
    }
    
    .notification-header button:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
    
    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .no-notifications {
      text-align: center;
      padding: 32px 16px;
      color: #6b7280;
    }
    
    .no-notifications mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }
    
    .notification-item {
      display: flex;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .notification-item:hover {
      background-color: #f8f9fa;
      transform: translateX(2px);
    }
    
    .notification-item.unread.user-theme { background-color: #e8f5e8; border-left-color: #4caf50; }
    .notification-item.unread.admin-theme { background-color: #e8f0ff; border-left-color: #2563eb; }
    
    .notification-item.unread.user-theme:hover { background-color: #edf7ee; }
    .notification-item.unread.admin-theme:hover { background-color: #e6efff; }
    
    .notification-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .notification-icon.info {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #1976d2;
    }
    
    .notification-icon.warning {
      background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
      color: #f57c00;
    }
    
    .notification-icon.danger {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      color: #d32f2f;
    }
    
    .notification-content {
      flex: 1;
      min-width: 0;
    }
    
    .notification-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 6px;
      font-size: 0.95rem;
      line-height: 1.3;
    }
    
    .notification-message {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    
    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .notification-meta mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .notification-time {
      font-size: 0.8rem;
      color: #9ca3af;
      white-space: nowrap;
    }
    
    .sensor-mq135 {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%) !important;
      color: #2e7d32 !important;
      font-weight: 500 !important;
    }
    
    .sensor-mq7 {
      background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%) !important;
      color: #ef6c00 !important;
      font-weight: 500 !important;
    }
    
    .sensor-mq4 {
      background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%) !important;
      color: #c2185b !important;
      font-weight: 500 !important;
    }
    
    .value-chip {
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%) !important;
      color: #424242 !important;
      font-weight: 600 !important;
    }
    
    .user-chip {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%) !important;
      color: #3730a3 !important;
      font-weight: 500 !important;
    }
    
    .notification-footer {
      padding: 16px;
      text-align: center;
      background-color: #f8f9fa;
    }
    
    .notification-footer button {
      color: #6b7280;
      transition: all 0.3s ease;
    }
    
    .notification-footer button:hover { color: inherit; background-color: rgba(0,0,0,0.04); }
    
    /* Scrollbar personalizado solo vertical */
    .notification-list::-webkit-scrollbar {
      width: 6px;
    }
    
    .notification-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    .notification-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    .notification-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    /* Evitar scroll horizontal */
    .notification-list {
      overflow-x: hidden;
    }
    
    .notification-meta {
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .notification-content {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() userRole: 'admin' | 'usuario' = 'usuario';
  
  notifications: Notification[] = [];
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Suscribirse a las notificaciones del servicio
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    // Suscribirse al contador de no leídas
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    // Iniciar monitoreo de notificaciones
    this.notificationService.startMonitoring(this.userRole);
  }

  ngOnDestroy() {
    // Detener monitoreo al destruir el componente
    this.notificationService.stopMonitoring();
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifications() {
    this.notificationService.clearAllNotifications();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'notifications';
    }
  }

  getSensorName(sensor: string): string {
    switch (sensor) {
      case 'mq135': return 'MQ-135';
      case 'mq7': return 'MQ-7';
      case 'mq4': return 'MQ-4';
      default: return sensor;
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }
}

