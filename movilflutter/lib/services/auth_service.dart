import '../models/user.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';
import 'dart:convert';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiService _apiService = ApiService();

  // Login
  Future<LoginResponse> login(String email, String password) async {
    try {
      final response = await _apiService.post(
        ApiConstants.loginEndpoint,
        data: {'email': email, 'password': password},
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Guardar token y datos del usuario
      await _apiService.saveToken(loginResponse.accessToken);
      // Guardar datos de usuario del JWT si existen
      final payload = _decodeJwt(loginResponse.accessToken);
      if (payload != null) {
        await _apiService.saveUserData(payload);
      }

      return loginResponse;
    } catch (e) {
      rethrow;
    }
  }

  Map<String, dynamic>? _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final normalized = base64Url.normalize(parts[1]);
      final payloadString = utf8.decode(base64Url.decode(normalized));
      return json.decode(payloadString) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Registro
  Future<Map<String, dynamic>> register(
    String nombre,
    String email,
    String password,
  ) async {
    final response = await _apiService.post(
      ApiConstants.registerEndpoint,
      data: {'nombre': nombre, 'email': email, 'password': password},
    );

    return response.data;
  }

  // Logout
  Future<Map<String, dynamic>> logout() async {
    final response = await _apiService.post(ApiConstants.logoutEndpoint);

    // Limpiar token y datos del usuario
    await _apiService.clearToken();

    return response.data;
  }

  // Obtener usuario actual
  Future<Usuario> getCurrentUser() async {
    final response = await _apiService.get(ApiConstants.currentUserEndpoint);
    return Usuario.fromJson(response.data);
  }

  // Verificar si está autenticado
  Future<bool> isAuthenticated() async {
    return await _apiService.isAuthenticated();
  }

  // Obtener token
  Future<String?> getToken() async {
    return await _apiService.getToken();
  }

  // Limpiar sesión
  Future<void> clearSession() async {
    await _apiService.clearToken();
  }
}
