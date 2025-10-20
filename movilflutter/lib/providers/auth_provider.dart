import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

// Provider para el servicio de autenticación
final authServiceProvider = Provider<AuthService>((ref) => AuthService());

// Provider para el estado de autenticación
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

// Estado de autenticación
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Usuario? user;
  final String? error;
  final String? token;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
    this.token,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Usuario? user,
    String? error,
    String? token,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: error,
      token: token ?? this.token,
    );
  }
}

// Notifier para manejar el estado de autenticación
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState()) {
    _checkAuthStatus();
  }

  // Verificar estado de autenticación al inicializar
  Future<void> _checkAuthStatus() async {
    // Siempre empezar sin autenticación para forzar login
    state = AuthState();
  }

  // Login
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final loginResponse = await _authService.login(email, password);

      // Construir usuario desde el JWT guardado por AuthService
      final userData = await ApiService().getUserData();
      final nombre =
          userData?['nombre'] ?? userData?['nombreCompleto'] ?? 'Usuario';
      final emailFromToken = userData?['sub'] ?? userData?['email'] ?? email;
      final rolStr = userData?['rol'] ?? loginResponse.rol;
      final rol = rolStr.toString().toLowerCase() == 'admin'
          ? RolEnum.admin
          : RolEnum.usuario;
      final imagenUrl = userData?['imagen_url'];

      final user = Usuario(
        id: userData?['user_id'] is int
            ? userData!['user_id'] as int
            : (userData?['user_id'] is num
                  ? (userData!['user_id'] as num).toInt()
                  : 0),
        nombre: nombre,
        email: emailFromToken,
        rol: rol,
        imagenUrl: imagenUrl,
      );

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: user,
        token: loginResponse.accessToken,
        error: null,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Registro
  Future<bool> register(String nombre, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _authService.register(nombre, email, password);
      state = state.copyWith(isLoading: false, error: null);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _authService.logout();
    } catch (e) {
      // Incluso si falla el logout en el servidor, continuar
    }
    // Siempre limpiar el estado local
    state = AuthState();
  }

  // Limpiar error
  void clearError() {
    state = state.copyWith(error: null);
  }

  // Actualizar usuario
  void updateUser(Usuario user) {
    state = state.copyWith(user: user);
  }
}

// Provider para verificar si el usuario es admin
final isAdminProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.user?.rol == RolEnum.admin;
});

// Provider para obtener el usuario actual
final currentUserProvider = Provider<Usuario?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.user;
});
