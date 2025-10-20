import { Injectable } from '@angular/core';
import { NotificationComponent } from './notification.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  showSuccess(title: string, message: string, duration: number = 5000) {
    NotificationComponent.show({
      type: 'success',
      title,
      message,
      icon: '✅',
      duration
    });
  }

  showError(title: string, message: string, duration: number = 7000) {
    NotificationComponent.show({
      type: 'error',
      title,
      message,
      icon: '❌',
      duration
    });
  }

  showWarning(title: string, message: string, duration: number = 6000) {
    NotificationComponent.show({
      type: 'warning',
      title,
      message,
      icon: '⚠️',
      duration
    });
  }

  showInfo(title: string, message: string, duration: number = 5000) {
    NotificationComponent.show({
      type: 'info',
      title,
      message,
      icon: 'ℹ️',
      duration
    });
  }

  // Métodos específicos para acciones de usuarios
  showUserCreated() {
    this.showSuccess(
      'Usuario Creado',
      'El usuario ha sido creado exitosamente',
      5000
    );
  }

  showUserUpdated() {
    this.showSuccess(
      'Usuario Actualizado',
      'Los datos del usuario han sido actualizados correctamente',
      5000
    );
  }

  showUserDeleted() {
    this.showSuccess(
      'Usuario Eliminado',
      'El usuario ha sido eliminado del sistema',
      5000
    );
  }

  showUserError(action: string, error: string) {
    this.showError(
      `Error al ${action}`,
      error,
      7000
    );
  }

  showUserWarning(message: string) {
    this.showWarning(
      'Advertencia',
      message,
      6000
    );
  }

  showUserSuccess(message: string) {
    this.showSuccess(
      'Éxito',
      message,
      5000
    );
  }
}
