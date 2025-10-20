import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import 'dart:convert';
import '../models/notificacion.dart';
import '../services/notification_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Provider para el servicio de notificaciones
final notificationServiceProvider = Provider<NotificationService>(
  (ref) => NotificationService(),
);

// Provider para notificaciones del usuario actual
final myNotificationsProvider = FutureProvider<List<Notificacion>>((ref) async {
  final notificationService = ref.read(notificationServiceProvider);
  return await notificationService.getMyNotifications();
});

// Provider para notificaciones de admin
final adminNotificationsProvider =
    FutureProvider.family<List<Notificacion>, Map<String, dynamic>>((
      ref,
      params,
    ) async {
      final notificationService = ref.read(notificationServiceProvider);
      return await notificationService.getAdminNotifications(
        limit: params['limit'],
        order: params['order'],
      );
    });

// Provider para configuración de notificaciones del usuario actual
final notificationConfigProvider = FutureProvider<ConfiguracionNotificaciones>((
  ref,
) async {
  final notificationService = ref.read(notificationServiceProvider);
  return await notificationService.getNotificationConfig();
});

// Provider para configuración de notificaciones de un usuario específico (admin)
final userNotificationConfigProvider =
    FutureProvider.family<ConfiguracionNotificaciones, int>((
      ref,
      userId,
    ) async {
      final notificationService = ref.read(notificationServiceProvider);
      return await notificationService.getUserNotificationConfig(userId);
    });

// Provider para el estado de notificaciones
final notificationStateProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
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
  Timer? _poll;
  final Set<int> _clearedNotificationIds = <int>{};

  NotificationNotifier(this._notificationService) : super(NotificationState()) {
    _initializeNotifications();
  }

  // Inicializar notificaciones con persistencia
  Future<void> _initializeNotifications() async {
    await _loadClearedNotifications();
    _loadNotifications();
    // Polling cada 5s para traer nuevas no leídas en tiempo real
    _poll = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _loadNotifications(),
    );
  }

  // Cargar IDs de notificaciones limpiadas desde SharedPreferences
  Future<void> _loadClearedNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final clearedIdsJson = prefs.getString('cleared_notifications');
      if (clearedIdsJson != null) {
        final List<dynamic> clearedIds = json.decode(clearedIdsJson);
        _clearedNotificationIds.addAll(clearedIds.cast<int>());
      }
    } catch (e) {
      print('Error loading cleared notifications: $e');
    }
  }

  // Guardar IDs de notificaciones limpiadas en SharedPreferences
  Future<void> _saveClearedNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final clearedIdsJson = json.encode(_clearedNotificationIds.toList());
      await prefs.setString('cleared_notifications', clearedIdsJson);
    } catch (e) {
      print('Error saving cleared notifications: $e');
    }
  }

  // Cargar notificaciones
  Future<void> _loadNotifications() async {
    state = state.copyWith(isLoading: true);

    try {
      final notifications = await _notificationService.getMyNotifications();

      // Filtrar notificaciones que fueron limpiadas localmente
      // Solo ocultar si el usuario la "limpió" Y sigue leída
      final filteredNotifications = notifications.where((n) {
        final wasCleared = _clearedNotificationIds.contains(n.id);
        // Si ahora está no leída, asegurarnos de reponerla (y limpiar el cleared)
        if (wasCleared && !n.leida) {
          _clearedNotificationIds.remove(n.id);
          _saveClearedNotifications();
          return true;
        }
        return !(wasCleared && n.leida);
      }).toList();

      final unreadCount = filteredNotifications.where((n) => !n.leida).length;

      state = state.copyWith(
        isLoading: false,
        notifications: filteredNotifications,
        unreadCount: unreadCount,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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

      // NO limpiar el conjunto de IDs limpiados - mantener el estado persistente
      // Refrescar desde backend para asegurar consistencia
      await _loadNotifications();

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
    // NO limpiar el conjunto de IDs limpiados - mantener el estado persistente
    await _loadNotifications();
  }

  // Limpiar todas las notificaciones leídas del listado (solo local)
  void clearAllRead() {
    // Registrar los IDs de las notificaciones leídas que se van a limpiar
    final readNotificationIds = state.notifications
        .where((n) => n.leida)
        .map((n) => n.id)
        .toSet();

    _clearedNotificationIds.addAll(readNotificationIds);

    // Guardar el estado persistente
    _saveClearedNotifications();

    final remaining = state.notifications.where((n) => !n.leida).toList();
    final unreadCount = remaining.where((n) => !n.leida).length;
    state = state.copyWith(notifications: remaining, unreadCount: unreadCount);
  }

  // Limpiar todo el estado (para logout)
  Future<void> clearAllState() async {
    _clearedNotificationIds.clear();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cleared_notifications');
    } catch (e) {
      print('Error clearing notification state: $e');
    }
    state = NotificationState();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }
}
