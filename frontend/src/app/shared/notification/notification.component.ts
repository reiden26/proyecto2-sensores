import { Component, Input, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title: string;
  icon: string;
  duration?: number;
  progress?: number;
  timer?: any;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div 
        *ngFor="let notification of notifications" 
        class="notification notification-{{ notification.type }}"
        [@slideInOut]
      >
        <div class="notification-content">
          <div class="notification-icon">
            {{ notification.icon }}
          </div>
          <div class="notification-text">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button class="notification-close" (click)="removeNotification(notification.id)">
            ✕
          </button>
        </div>
        <div class="notification-progress" [style.width.%]="notification.progress"></div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .notification {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      position: relative;
    }

    .notification-content {
      display: flex;
      align-items: center;
      padding: 1rem;
      gap: 0.75rem;
    }

    .notification-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .notification-text {
      flex: 1;
    }

    .notification-title {
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .notification-message {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .notification-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s ease;
      opacity: 0.7;
    }

    .notification-close:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }

    .notification-progress {
      height: 3px;
      background: currentColor;
      transition: width linear;
      position: absolute;
      bottom: 0;
      left: 0;
    }

    /* Success notification */
    .notification-success {
      background: #4CAF50; /* Verde sólido para mejor contraste */
      color: #ffffff;      /* Texto blanco */
      border-color: #43a047; /* Borde ligeramente más oscuro */
    }

    .notification-success .notification-icon {
      background: rgba(255, 255, 255, 0.2); /* Halo claro sobre fondo verde */
      color: #ffffff;
    }

    /* Error notification */
    .notification-error {
      background: #f44336; /* Rojo sólido */
      color: #ffffff;      /* Texto blanco */
      border-color: #d32f2f; /* Borde ligeramente más oscuro */
    }

    .notification-error .notification-icon {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    /* Warning notification */
    .notification-warning {
      background: #ffc107; /* Amarillo sólido para mejor contraste */
      color: #ffffff;      /* Texto blanco */
      border-color: #ffb300; /* Borde ligeramente más oscuro */
    }

    .notification-warning .notification-icon {
      background: rgba(255, 255, 255, 0.2); /* Halo claro sobre fondo amarillo */
      color: #ffffff;
    }

    /* Info notification */
    .notification-info {
      border-color: rgba(33, 150, 243, 0.3);
      color: #2196f3;
    }

    .notification-info .notification-icon {
      background: rgba(33, 150, 243, 0.2);
    }

    /* Animations */
    .notification {
      animation: slideInRight 0.3s ease-out;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification.removing {
      animation: slideOutRight 0.3s ease-in;
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notification-container {
        right: 10px;
        left: 10px;
      }
      
      .notification {
        min-width: auto;
        max-width: none;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private nextId = 1;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Listen for custom events only in browser
    if (this.isBrowser) {
      document.addEventListener('showNotification', this.handleNotification.bind(this));
    }
  }

  ngOnDestroy() {
    // Remove event listener only in browser
    if (this.isBrowser) {
      document.removeEventListener('showNotification', this.handleNotification.bind(this));
    }
  }

  private handleNotification(event: any) {
    this.showNotification(event.detail);
  }

  showNotification(notification: Omit<Notification, 'id'>) {
    const id = this.nextId++;
    const newNotification = {
      ...notification,
      id,
      progress: 100,
      duration: notification.duration || 5000
    };

    this.notifications.push(newNotification);

    // Start progress bar animation
    const startTime = Date.now();
    const duration = newNotification.duration;

    newNotification.timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      
      const notificationIndex = this.notifications.findIndex(n => n.id === id);
      if (notificationIndex !== -1) {
        this.notifications[notificationIndex].progress = remaining;
      }

      if (remaining <= 0) {
        this.removeNotification(id);
      }
    }, 50);
  }

  removeNotification(id: number) {
    const notificationIndex = this.notifications.findIndex(n => n.id === id);
    if (notificationIndex !== -1) {
      const notification = this.notifications[notificationIndex];
      
      // Clear timer
      if (notification.timer) {
        clearInterval(notification.timer);
      }

      // Add removing class for animation
      notification.progress = 0;
      
      // Remove after animation
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  // Static method to show notifications from anywhere
  static show(notification: Omit<Notification, 'id'>) {
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('showNotification', { detail: notification });
      document.dispatchEvent(event);
    }
  }
}
