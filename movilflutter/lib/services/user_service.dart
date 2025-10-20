import '../models/user.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class UserService {
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  final ApiService _apiService = ApiService();

  // Obtener todos los usuarios (admin)
  Future<List<Usuario>> getAllUsers() async {
    try {
      final response = await _apiService.get(ApiConstants.usersReportEndpoint);

      if (response.data == null) {
        return [];
      }

      // El endpoint /reportes/usuarios devuelve { "actividad_usuarios": [...] }
      if (response.data is Map && response.data['actividad_usuarios'] != null) {
        return (response.data['actividad_usuarios'] as List)
            .map((json) => Usuario.fromJson(json))
            .toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error al obtener usuarios: $e');
      return [];
    }
  }

  // Obtener usuario por ID
  Future<Usuario> getUserById(int userId) async {
    final response = await _apiService.get(
      ApiConstants.userByIdEndpoint.replaceAll('{id}', userId.toString()),
    );
    return Usuario.fromJson(response.data);
  }

  // Crear nuevo usuario
  Future<Usuario> createUser({
    required String nombre,
    required String email,
    required String password,
    required RolEnum rol,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.usersEndpoint,
        data: {
          'nombre': nombre,
          'email': email,
          'password': password,
          'rol': rol.name,
        },
      );
      return Usuario.fromJson(response.data);
    } catch (e) {
      print('Error al crear usuario: $e');
      rethrow;
    }
  }

  // Actualizar usuario
  Future<Usuario> updateUser(int userId, Map<String, dynamic> userData) async {
    final response = await _apiService.put(
      ApiConstants.userByIdEndpoint.replaceAll('{id}', userId.toString()),
      data: userData,
    );
    return Usuario.fromJson(response.data);
  }

  // Eliminar usuario
  Future<void> deleteUser(int userId) async {
    await _apiService.delete(
      ApiConstants.userByIdEndpoint.replaceAll('{id}', userId.toString()),
    );
  }

  // Cambiar contraseña
  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await _apiService.post(
      '/usuario/cambiar-password',
      data: {'current_password': currentPassword, 'new_password': newPassword},
    );
  }

  // Obtener usuario actual
  Future<Usuario> getCurrentUser() async {
    final response = await _apiService.get(ApiConstants.currentUserEndpoint);
    return Usuario.fromJson(response.data);
  }

  // Actualizar perfil del usuario actual
  Future<Usuario> updateProfile(Map<String, dynamic> profileData) async {
    final response = await _apiService.put(
      '/usuario/perfil',
      data: profileData,
    );
    return Usuario.fromJson(response.data);
  }

  // Obtener configuración de sesión del usuario actual
  Future<Map<String, dynamic>> getMySessionConfig() async {
    final response = await _apiService.get('/configuracion-sesion/me');
    return response.data as Map<String, dynamic>;
  }

  // Obtener configuración de notificaciones del usuario actual
  Future<Map<String, dynamic>> getMyNotificationConfig() async {
    final response = await _apiService.get('/configuracion-notificaciones/me');
    return response.data as Map<String, dynamic>;
  }

  // Actualizar configuración de sesión del usuario actual
  Future<void> updateMySessionConfig({bool? prolongar}) async {
    final data = <String, dynamic>{};
    if (prolongar != null) data['prolongar'] = prolongar;

    await _apiService.put('/configuracion-sesion/me', data: data);
  }

  // Actualizar configuración de notificaciones del usuario actual
  Future<void> updateMyNotificationConfig(Map<String, dynamic> config) async {
    await _apiService.put('/configuracion-notificaciones/me', data: config);
  }

  // Actualizar perfil de usuario (alias para updateProfile)
  Future<Usuario> updateUserProfile(
    int userId, {
    String? nombre,
    String? email,
    String? password,
  }) async {
    final data = <String, dynamic>{};
    if (nombre != null) data['nombre'] = nombre;
    if (email != null) data['email'] = email;
    if (password != null) data['password'] = password;

    return await updateUser(userId, data);
  }

  // Obtener sensores asignados a un usuario
  Future<List<Map<String, dynamic>>> getUserSensors(int userId) async {
    try {
      final response = await _apiService.get(
        ApiConstants.userSensorsEndpoint.replaceAll('{id}', userId.toString()),
      );
      return List<Map<String, dynamic>>.from(response.data['sensores'] ?? []);
    } catch (e) {
      print('Error al obtener sensores del usuario: $e');
      return [];
    }
  }

  // Actualizar sensores asignados a un usuario
  Future<void> updateUserSensors(int userId, List<int> sensorIds) async {
    try {
      await _apiService.put(
        ApiConstants.userSensorsEndpoint.replaceAll('{id}', userId.toString()),
        data: {'asignados': sensorIds},
      );
    } catch (e) {
      print('Error al actualizar sensores del usuario: $e');
      rethrow;
    }
  }
}
