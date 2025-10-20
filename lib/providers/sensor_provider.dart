import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sensor.dart';
import '../models/lectura.dart';
import '../services/sensor_service.dart';

// Provider para el servicio de sensores
final sensorServiceProvider = Provider<SensorService>((ref) => SensorService());

// Provider para sensores activos
final activeSensorsProvider = FutureProvider<SensoresActivos>((ref) async {
  final sensorService = ref.read(sensorServiceProvider);
  return await sensorService.getActiveSensors();
});

// Provider para lecturas del usuario actual
final myReadingsProvider = FutureProvider.family<LecturasUsuario, int?>((ref, limit) async {
  final sensorService = ref.read(sensorServiceProvider);
  return await sensorService.getMyReadings(limit: limit);
});

// Provider para todas las lecturas (admin)
final adminReadingsProvider = FutureProvider.family<LecturasAdmin, int?>((ref, limit) async {
  final sensorService = ref.read(sensorServiceProvider);
  return await sensorService.getAdminReadings(limit: limit);
});

// Provider para sensores (admin)
final sensorsProvider = FutureProvider<List<Sensor>>((ref) async {
  final sensorService = ref.read(sensorServiceProvider);
  return await sensorService.getSensors();
});

// Provider para sensores de un usuario específico (admin)
final userSensorsProvider = FutureProvider.family<List<Sensor>, int>((ref, userId) async {
  final sensorService = ref.read(sensorServiceProvider);
  return await sensorService.getUserSensors(userId);
});

// Provider para el estado de captura de sensores
final sensorCaptureStateProvider = StateNotifierProvider<SensorCaptureNotifier, SensorCaptureState>((ref) {
  return SensorCaptureNotifier(ref.read(sensorServiceProvider));
});

// Estado de captura de sensores
class SensorCaptureState {
  final bool isLoading;
  final Map<String, bool> sensorStates; // sensor_codigo -> isActive
  final Map<String, bool> connectionStates; // sensor_codigo -> isConnected
  final String? error;

  SensorCaptureState({
    this.isLoading = false,
    this.sensorStates = const {},
    this.connectionStates = const {},
    this.error,
  });

  SensorCaptureState copyWith({
    bool? isLoading,
    Map<String, bool>? sensorStates,
    Map<String, bool>? connectionStates,
    String? error,
  }) {
    return SensorCaptureState(
      isLoading: isLoading ?? this.isLoading,
      sensorStates: sensorStates ?? this.sensorStates,
      connectionStates: connectionStates ?? this.connectionStates,
      error: error,
    );
  }
}

// Notifier para manejar el estado de captura de sensores
class SensorCaptureNotifier extends StateNotifier<SensorCaptureState> {
  final SensorService _sensorService;

  SensorCaptureNotifier(this._sensorService) : super(SensorCaptureState()) {
    _loadActiveSensors();
  }

  // Cargar sensores activos
  Future<void> _loadActiveSensors() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final activeSensors = await _sensorService.getActiveSensors();
      final sensorStates = {
        'mq135': activeSensors.mq135Activo,
        'mq4': activeSensors.mq4Activo,
        'mq7': activeSensors.mq7Activo,
      };
      
      state = state.copyWith(
        isLoading: false,
        sensorStates: sensorStates,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // Activar captura de un sensor
  Future<bool> activateCapture(String sensorCodigo) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final response = await _sensorService.activateCapture(sensorCodigo);
      final isConnected = response['conectado'] ?? false;
      
      final newSensorStates = Map<String, bool>.from(state.sensorStates);
      newSensorStates[sensorCodigo] = true;
      
      final newConnectionStates = Map<String, bool>.from(state.connectionStates);
      newConnectionStates[sensorCodigo] = isConnected;
      
      state = state.copyWith(
        isLoading: false,
        sensorStates: newSensorStates,
        connectionStates: newConnectionStates,
        error: null,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Desactivar captura de un sensor
  Future<bool> deactivateCapture(String sensorCodigo) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      await _sensorService.deactivateCapture(sensorCodigo);
      
      final newSensorStates = Map<String, bool>.from(state.sensorStates);
      newSensorStates[sensorCodigo] = false;
      
      final newConnectionStates = Map<String, bool>.from(state.connectionStates);
      newConnectionStates[sensorCodigo] = false;
      
      state = state.copyWith(
        isLoading: false,
        sensorStates: newSensorStates,
        connectionStates: newConnectionStates,
        error: null,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // Verificar si un sensor está activo
  bool isSensorActive(String sensorCodigo) {
    return state.sensorStates[sensorCodigo] ?? false;
  }

  // Verificar si un sensor está conectado
  bool isSensorConnected(String sensorCodigo) {
    return state.connectionStates[sensorCodigo] ?? false;
  }

  // Limpiar error
  void clearError() {
    state = state.copyWith(error: null);
  }

  // Refrescar estado
  Future<void> refresh() async {
    await _loadActiveSensors();
  }
}


