import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

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
    state = state.copyWith(isLoading: true);
    
    try {
      final isAuthenticated = await _authService.isAuthenticated();
      if (isAuthenticated) {
        final user = await _authService.getCurrentUser();
        final token = await _authService.getToken();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: user,
          token: token,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: e.toString(),
      );
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final loginResponse = await _authService.login(email, password);
      final user = await _authService.getCurrentUser();
      
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
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    
    try {
      await _authService.logout();
    } catch (e) {
      // Incluso si falla el logout en el servidor, limpiar el estado local
    }
    
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


