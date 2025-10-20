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
    return SensoresActivos.fromJson(response.data);
  }

  // Activar captura de un sensor
  Future<Map<String, dynamic>> activateCapture(String sensorCodigo) async {
    final response = await _apiService.post(
      ApiConstants.activateCaptureEndpoint.replaceAll('{sensor_codigo}', sensorCodigo),
    );
    return response.data;
  }

  // Desactivar captura de un sensor
  Future<Map<String, dynamic>> deactivateCapture(String sensorCodigo) async {
    final response = await _apiService.post(
      ApiConstants.deactivateCaptureEndpoint.replaceAll('{sensor_codigo}', sensorCodigo),
    );
    return response.data;
  }

  // Obtener lecturas del usuario actual
  Future<LecturasUsuario> getMyReadings({int? limit}) async {
    final queryParams = limit != null ? {'limit': limit} : null;
    final response = await _apiService.get(
      ApiConstants.myReadingsEndpoint,
      queryParameters: queryParams,
    );
    return LecturasUsuario.fromJson(response.data);
  }

  // Obtener lecturas para admin
  Future<LecturasAdmin> getAdminReadings({int? limit}) async {
    final queryParams = limit != null ? {'limit': limit} : null;
    final response = await _apiService.get(
      ApiConstants.adminReadingsEndpoint,
      queryParameters: queryParams,
    );
    return LecturasAdmin.fromJson(response.data);
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


