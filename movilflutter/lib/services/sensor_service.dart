import '../models/sensor.dart';
import '../models/lectura.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class SensorService {
  static final SensorService _instance = SensorService._internal();
  factory SensorService() => _instance;
  SensorService._internal();

  final ApiService _apiService = ApiService();

  // Obtener todos los sensores (admin)
  Future<List<Sensor>> getSensors() async {
    final response = await _apiService.get(ApiConstants.sensorsEndpoint);
    return (response.data as List)
        .map((json) => Sensor.fromJson(json))
        .toList();
  }

  // Obtener sensores de un usuario (admin)
  Future<List<Sensor>> getUserSensors(int userId) async {
    final response = await _apiService.get(
      ApiConstants.userSensorsEndpoint.replaceAll('{id}', userId.toString()),
    );
    return (response.data as List)
        .map((json) => Sensor.fromJson(json))
        .toList();
  }

  // Obtener sensores activos del usuario actual
  Future<SensoresActivos> getActiveSensors() async {
    final response = await _apiService.get(ApiConstants.activeSensorsEndpoint);
    final raw = Map<String, dynamic>.from(response.data as Map);
    // El backend responde snake_case: mq135_activo, mq4_activo, mq7_activo
    // Normalizamos a las claves esperadas por el modelo SensoresActivos
    final sanitized = <String, dynamic>{
      // Estas claves pueden no existir en la respuesta, las normalizamos
      'id': (raw['id'] is num) ? (raw['id'] as num).toInt() : 0,
      'usuarioId': (raw['usuario_id'] is num)
          ? (raw['usuario_id'] as num).toInt()
          : (raw['usuarioId'] is num ? (raw['usuarioId'] as num).toInt() : 0),
      'mq135Activo': raw['mq135_activo'] == true || raw['mq135Activo'] == true,
      'mq4Activo': raw['mq4_activo'] == true || raw['mq4Activo'] == true,
      'mq7Activo': raw['mq7_activo'] == true || raw['mq7Activo'] == true,
      'actualizadoEn':
          raw['actualizado_en'] ??
          raw['actualizadoEn'] ??
          DateTime.now().toIso8601String(),
    };
    return SensoresActivos.fromJson(sanitized);
  }

  // Activar captura de un sensor
  Future<Map<String, dynamic>> activateCapture(String sensorCodigo) async {
    final response = await _apiService.post(
      ApiConstants.activateCaptureEndpoint.replaceAll(
        '{sensor_codigo}',
        sensorCodigo,
      ),
    );
    return response.data;
  }

  // Desactivar captura de un sensor
  Future<Map<String, dynamic>> deactivateCapture(String sensorCodigo) async {
    final response = await _apiService.post(
      ApiConstants.deactivateCaptureEndpoint.replaceAll(
        '{sensor_codigo}',
        sensorCodigo,
      ),
    );
    return response.data;
  }

  // Activar captura para todos (siguiendo app web)
  Future<void> activateAll() async {
    await _apiService.post(ApiConstants.activateAllCaptureEndpoint);
  }

  // Desactivar captura global (siguiendo app web)
  Future<void> deactivateAll() async {
    await _apiService.post(ApiConstants.deactivateAllCaptureEndpoint);
  }

  // Obtener lecturas del usuario actual
  Future<LecturasUsuario> getMyReadings({int? limit}) async {
    final queryParams = limit != null ? {'limit': limit} : null;
    final response = await _apiService.get(
      ApiConstants.myReadingsEndpoint,
      queryParameters: queryParams,
    );

    // Sanitizar por si el backend trae algún campo nulo inesperado
    final raw = Map<String, dynamic>.from(response.data as Map);
    Map<String, dynamic> safe(Map<String, dynamic> m) => {
      'id': (m['id'] is num) ? (m['id'] as num).toInt() : 0,
      'valor': (m['valor'] is num) ? (m['valor'] as num).toDouble() : null,
      'estado': m['estado'] ?? 'bueno',
      'creado_en':
          m['creado_en'] ?? m['creadoEn'] ?? DateTime.now().toIso8601String(),
    };

    List sanitizeList(dynamic list) {
      final source = (list is List) ? list : <dynamic>[];
      return source
          .whereType<Map>()
          .map((e) => safe(Map<String, dynamic>.from(e)))
          .toList();
    }

    final sanitized = <String, dynamic>{
      'mq135': sanitizeList(raw['mq135']),
      'mq4': sanitizeList(raw['mq4']),
      'mq7': sanitizeList(raw['mq7']),
    };

    return LecturasUsuario.fromJson(sanitized);
  }

  // Obtener lecturas para admin
  Future<LecturasAdmin> getAdminReadings({int? limit}) async {
    final queryParams = limit != null ? {'limit': limit} : null;
    final response = await _apiService.get(
      ApiConstants.adminReadingsEndpoint,
      queryParameters: queryParams,
    );
    // Algunos backends devuelven snake_case. Normalizamos a las claves esperadas por el modelo.
    Map<String, dynamic> raw = Map<String, dynamic>.from(response.data as Map);

    List<Map<String, dynamic>> sanitizeList(dynamic list) {
      if (list is! List) return <Map<String, dynamic>>[];
      return list.map<Map<String, dynamic>>((e) {
        final m = Map<String, dynamic>.from(e as Map);
        return <String, dynamic>{
          'id': m['id'],
          'usuarioId': m['usuarioId'] ?? m['usuario_id'],
          'usuarioNombre': m['usuarioNombre'] ?? m['usuario_nombre'],
          'valor': m['valor'],
          'estado': m['estado'],
          'creadoEn': m['creadoEn'] ?? m['creado_en'],
          'fechaLectura':
              m['fechaLectura'] ?? m['fecha_lectura'] ?? m['creado_en'],
        };
      }).toList();
    }

    final sanitized = <String, dynamic>{
      'mq135': sanitizeList(raw['mq135']),
      'mq4': sanitizeList(raw['mq4']),
      'mq7': sanitizeList(raw['mq7']),
    };

    return LecturasAdmin.fromJson(sanitized);
  }

  // Obtener todas las lecturas con filtros
  Future<List<Lectura>> getAllReadings({
    int? usuarioId,
    int? sensorId,
    String? estado,
    int? limit,
  }) async {
    final queryParams = <String, dynamic>{};
    if (usuarioId != null) queryParams['usuario_id'] = usuarioId;
    if (sensorId != null) queryParams['sensor_id'] = sensorId;
    if (estado != null) queryParams['estado'] = estado;
    if (limit != null) queryParams['limit'] = limit;

    final response = await _apiService.get(
      ApiConstants.readingsEndpoint,
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    return (response.data as List)
        .map((json) => Lectura.fromJson(json))
        .toList();
  }

  // Actualizar sensores de un usuario (admin)
  Future<Map<String, dynamic>> updateUserSensors(
    int userId,
    List<int> sensorIds,
  ) async {
    final response = await _apiService.put(
      ApiConstants.userSensorsEndpoint.replaceAll('{id}', userId.toString()),
      data: {'asignados': sensorIds},
    );
    return response.data;
  }

  // Asignar sensor a usuario (admin)
  Future<Map<String, dynamic>> assignSensorToUser(
    int userId,
    int sensorId,
  ) async {
    final response = await _apiService.post(
      '${ApiConstants.userSensorsEndpoint.replaceAll('{id}', userId.toString())}/$sensorId',
    );
    return response.data;
  }

  // Desasignar sensor de usuario (admin)
  Future<Map<String, dynamic>> unassignSensorFromUser(
    int userId,
    int sensorId,
  ) async {
    final response = await _apiService.delete(
      '${ApiConstants.userSensorsEndpoint.replaceAll('{id}', userId.toString())}/$sensorId',
    );
    return response.data;
  }
}
