import '../models/notificacion.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final ApiService _apiService = ApiService();

  // Obtener notificaciones del usuario actual
  Future<List<Notificacion>> getMyNotifications() async {
    final response = await _apiService.get(ApiConstants.myNotificationsEndpoint);
    final data = response.data;
    if (data is List) {
      return data.map((e) => e is Map<String, dynamic>
          ? Notificacion.fromFlexible(e)
          : Notificacion.fromFlexible(Map<String, dynamic>.from(e as Map))).toList();
    }
    if (data is Map<String, dynamic> && data['items'] is List) {
      final list = data['items'] as List;
      return list.map((e) => Notificacion.fromFlexible(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [];
  }

  // Obtener notificaciones para admin
  Future<List<Notificacion>> getAdminNotifications({
    int? limit,
    String? order,
  }) async {
    final queryParams = <String, dynamic>{};
    if (limit != null) queryParams['limit'] = limit;
    if (order != null) queryParams['order'] = order;

    final response = await _apiService.get(
      ApiConstants.adminNotificationsEndpoint,
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    return (response.data as List)
        .map((json) => Notificacion.fromJson(json))
        .toList();
  }

  // Crear notificación (admin)
  Future<Notificacion> createNotification(NotificacionCreate notification) async {
    final response = await _apiService.post(
      ApiConstants.notificationsEndpoint,
      data: notification.toJson(),
    );
    return Notificacion.fromJson(response.data);
  }

  // Actualizar notificación (admin)
  Future<Notificacion> updateNotification(
    int notificationId,
    NotificacionUpdate notification,
  ) async {
    final response = await _apiService.put(
      '${ApiConstants.notificationsEndpoint}/$notificationId',
      data: notification.toJson(),
    );
    return Notificacion.fromJson(response.data);
  }

  // Marcar notificación como leída
  Future<Map<String, dynamic>> markNotificationAsRead(int notificationId) async {
    final response = await _apiService.put(
      ApiConstants.markNotificationReadEndpoint.replaceAll('{id}', notificationId.toString()),
      data: <String, dynamic>{},
    );
    return response.data;
  }

  // Marcar todas las notificaciones como leídas
  Future<Map<String, dynamic>> markAllNotificationsAsRead() async {
    final response = await _apiService.put(
      ApiConstants.markAllNotificationsReadEndpoint,
      data: <String, dynamic>{},
    );
    return response.data;
  }

  // Eliminar notificación
  Future<Map<String, dynamic>> deleteNotification(int notificationId) async {
    final response = await _apiService.delete(
      '${ApiConstants.notificationsEndpoint}/$notificationId',
    );
    return response.data;
  }

  // Obtener configuración de notificaciones del usuario actual
  Future<ConfiguracionNotificaciones> getNotificationConfig() async {
    final response = await _apiService.get(ApiConstants.userNotificationConfigMe);
    return ConfiguracionNotificaciones.fromJson(response.data);
  }

  // Actualizar configuración de notificaciones del usuario actual
  Future<ConfiguracionNotificaciones> updateNotificationConfig(
    ConfiguracionNotificacionesUpdate config,
  ) async {
    final response = await _apiService.put(
      ApiConstants.userNotificationConfigMe,
      data: config.toJson(),
    );
    return ConfiguracionNotificaciones.fromJson(response.data);
  }

  // Obtener configuración de notificaciones de un usuario (admin)
  Future<ConfiguracionNotificaciones> getUserNotificationConfig(int userId) async {
    final response = await _apiService.get(
      '${ApiConstants.userNotificationConfigMe.replaceAll('/me', '')}/$userId',
    );
    return ConfiguracionNotificaciones.fromJson(response.data);
  }

  // Actualizar configuración de notificaciones de un usuario (admin)
  Future<ConfiguracionNotificaciones> updateUserNotificationConfig(
    int userId,
    ConfiguracionNotificacionesUpdate config,
  ) async {
    final response = await _apiService.put(
      '${ApiConstants.userNotificationConfigMe.replaceAll('/me', '')}/$userId',
      data: config.toJson(),
    );
    return ConfiguracionNotificaciones.fromJson(response.data);
  }
}
