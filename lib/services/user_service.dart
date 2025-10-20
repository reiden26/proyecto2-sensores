import '../models/user.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class UserService {
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  final ApiService _apiService = ApiService();

  // Obtener todos los usuarios (admin)
  Future<List<Usuario>> getUsers() async {
    final response = await _apiService.get(ApiConstants.usersEndpoint);
    return (response.data as List)
        .map((json) => Usuario.fromJson(json))
        .toList();
  }

  // Obtener usuario por ID
  Future<Usuario> getUser(int userId) async {
    final response = await _apiService.get(
      ApiConstants.userEndpoint.replaceAll('{id}', userId.toString()),
    );
    return Usuario.fromJson(response.data);
  }

  // Crear usuario (admin)
  Future<Map<String, dynamic>> createUser(UsuarioCreate user) async {
    final response = await _apiService.post(
      ApiConstants.usersEndpoint,
      data: user.toJson(),
    );
    return response.data;
  }

  // Actualizar usuario
  Future<Map<String, dynamic>> updateUser(
    int userId,
    UsuarioUpdate user,
  ) async {
    final response = await _apiService.put(
      ApiConstants.userEndpoint.replaceAll('{id}', userId.toString()),
      data: user.toJson(),
    );
    return response.data;
  }

  // Eliminar usuario (admin)
  Future<Map<String, dynamic>> deleteUser(int userId) async {
    final response = await _apiService.delete(
      ApiConstants.userEndpoint.replaceAll('{id}', userId.toString()),
    );
    return response.data;
  }

  // Obtener estado de usuarios en tiempo real (admin)
  Future<Map<String, dynamic>> getUsersStatus() async {
    final response = await _apiService.get('/admin/estado-usuarios');
    return response.data;
  }

  // Obtener usuarios con información de sesión (admin)
  Future<List<Map<String, dynamic>>> getUsersWithSession({
    String? q,
    String? rol,
    bool? prolongar,
    bool? activa,
  }) async {
    final queryParams = <String, dynamic>{};
    if (q != null) queryParams['q'] = q;
    if (rol != null) queryParams['rol'] = rol;
    if (prolongar != null) queryParams['prolongar'] = prolongar;
    if (activa != null) queryParams['activa'] = activa;

    final response = await _apiService.get(
      '/admin/usuarios-sesion',
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    return List<Map<String, dynamic>>.from(response.data);
  }

  // Limpiar sesiones expiradas (admin)
  Future<Map<String, dynamic>> cleanExpiredSessions() async {
    final response = await _apiService.post('/admin/limpiar-sesiones');
    return response.data;
  }
}


