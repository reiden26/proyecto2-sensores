import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notificacion.dart';
import '../services/notification_service.dart';

// Provider para el servicio de notificaciones
final notificationServiceProvider = Provider<NotificationService>((ref) => NotificationService());

// Provider para notificaciones del usuario actual
final myNotificationsProvider = FutureProvider<List<Notificacion>>((ref) async {
  final notificationService = ref.read(notificationServiceProvider);
  return await notificationService.getMyNotifications();
});

// Provider para notificaciones de admin
final adminNotificationsProvider = FutureProvider.family<List<Notificacion>, Map<String, dynamic>>((ref, params) async {
  final notificationService = ref.read(notificationServiceProvider);
  return await notificationService.getAdminNotifications(
    limit: params['limit'],
    order: params['order'],
  );
});

// Provider para configuración de notificaciones del usuario actual
final notificationConfigProvider = FutureProvider<ConfiguracionNotificaciones>((ref) async {
  final notificationService = ref.read(notificationServiceProvider);
  return await notificationService.getNotificationConfig();
});

// Provider para configuración de notificaciones de un usuario específico (admin)
final userNotificationConfigProvider = FutureProvider.family<ConfiguracionNotificaciones, int>((ref, userId) async {
  final notificationService = ref.read(notificationServiceProvider);
  return await notificationService.getUserNotificationConfig(userId);
});

// Provider para el estado de notificaciones
final notificationStateProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  return NotificationNotifier(ref.read(notificationServiceProvider));
});

// Estado de notificaciones
class NotificationState {
  final bool isLoading;
  final List<Notificacion> notifications;
  final int unreadCount;
  final String? error;

  NotificationState({
    this.isLoading = false,
    this.notifications = const [],
    this.unreadCount = 0,
    this.error,
  });

  NotificationState copyWith({
    bool? isLoading,
    List<Notificacion>? notifications,
    int? unreadCount,
    String? error,
  }) {
    return NotificationState(
      isLoading: isLoading ?? this.isLoading,
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      error: error,
    );
  }
}

// Notifier para manejar el estado de notificaciones
class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationService _notificationService;

  NotificationNotifier(this._notificationService) : super(NotificationState()) {
    _loadNotifications();
  }

  // Cargar notificaciones
  Future<void> _loadNotifications() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final notifications = await _notificationService.getMyNotifications();
      final unreadCount = notifications.where((n) => !n.leida).length;
      
      state = state.copyWith(
        isLoading: false,
        notifications: notifications,
        unreadCount: unreadCount,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // Marcar notificación como leída
  Future<bool> markAsRead(int notificationId) async {
    try {
      await _notificationService.markNotificationAsRead(notificationId);
      
      // Actualizar el estado local
      final updatedNotifications = state.notifications.map((notification) {
        if (notification.id == notificationId) {
          return Notificacion(
            id: notification.id,
            usuarioId: notification.usuarioId,
            sensorCodigo: notification.sensorCodigo,
            valor: notification.valor,
            estado: notification.estado,
            titulo: notification.titulo,
            mensaje: notification.mensaje,
            tipo: notification.tipo,
            leida: true,
            creadoEn: notification.creadoEn,
            leidoEn: DateTime.now(),
          );
        }
        return notification;
      }).toList();
      
      final unreadCount = updatedNotifications.where((n) => !n.leida).length;
      
      state = state.copyWith(
        notifications: updatedNotifications,
        unreadCount: unreadCount,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  // Marcar todas las notificaciones como leídas
  Future<bool> markAllAsRead() async {
    try {
      await _notificationService.markAllNotificationsAsRead();
      
      // Actualizar el estado local
      final updatedNotifications = state.notifications.map((notification) {
        return Notificacion(
          id: notification.id,
          usuarioId: notification.usuarioId,
          sensorCodigo: notification.sensorCodigo,
          valor: notification.valor,
          estado: notification.estado,
          titulo: notification.titulo,
          mensaje: notification.mensaje,
          tipo: notification.tipo,
          leida: true,
          creadoEn: notification.creadoEn,
          leidoEn: DateTime.now(),
        );
      }).toList();
      
      state = state.copyWith(
        notifications: updatedNotifications,
        unreadCount: 0,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  // Eliminar notificación
  Future<bool> deleteNotification(int notificationId) async {
    try {
      await _notificationService.deleteNotification(notificationId);
      
      // Actualizar el estado local
      final updatedNotifications = state.notifications
          .where((notification) => notification.id != notificationId)
          .toList();
      
      final unreadCount = updatedNotifications.where((n) => !n.leida).length;
      
      state = state.copyWith(
        notifications: updatedNotifications,
        unreadCount: unreadCount,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  // Agregar nueva notificación (para notificaciones en tiempo real)
  void addNotification(Notificacion notification) {
    final updatedNotifications = [notification, ...state.notifications];
    final unreadCount = updatedNotifications.where((n) => !n.leida).length;
    
    state = state.copyWith(
      notifications: updatedNotifications,
      unreadCount: unreadCount,
    );
  }

  // Limpiar error
  void clearError() {
    state = state.copyWith(error: null);
  }

  // Refrescar notificaciones
  Future<void> refresh() async {
    await _loadNotifications();
  }
}


