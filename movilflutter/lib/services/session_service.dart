import '../models/sesion.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class SessionService {
  static final SessionService _instance = SessionService._internal();
  factory SessionService() => _instance;
  SessionService._internal();

  final ApiService _apiService = ApiService();

  // Obtener historial de sesiones del usuario actual
  Future<List<SesionHistorial>> getSessionHistory() async {
    final response = await _apiService.get(ApiConstants.sessionHistoryEndpoint);
    return (response.data as List)
        .map((json) => SesionHistorial.fromJson(json))
        .toList();
  }

  // Obtener última sesión consolidada del usuario actual
  Future<SesionConsolidada> getLastConsolidatedSession() async {
    final response = await _apiService.get(ApiConstants.lastSessionEndpoint);
    return SesionConsolidada.fromJson(response.data);
  }

  // Limpiar sesiones vacías del usuario actual
  Future<Map<String, dynamic>> cleanEmptySessions() async {
    final response = await _apiService.post(ApiConstants.cleanEmptySessionsEndpoint);
    return response.data;
  }
}
