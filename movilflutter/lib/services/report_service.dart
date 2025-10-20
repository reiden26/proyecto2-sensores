import '../models/reporte.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class ReportService {
  static final ReportService _instance = ReportService._internal();
  factory ReportService() => _instance;
  ReportService._internal();

  final ApiService _apiService = ApiService();

  // Obtener estadísticas del dashboard (admin)
  Future<DashboardStats> getDashboardStats() async {
    try {
      final response = await _apiService.get(
        ApiConstants.dashboardStatsEndpoint,
      );

      if (response.data == null) {
        return DashboardStats(
          totalUsers: 0,
          totalSensors: 0,
          totalDataPoints: 0,
          activeNotifications: 0,
        );
      }

      return DashboardStats.fromJson(response.data);
    } catch (e) {
      print('Error al obtener estadísticas del dashboard: $e');
      return DashboardStats(
        totalUsers: 0,
        totalSensors: 0,
        totalDataPoints: 0,
        activeNotifications: 0,
      );
    }
  }

  // Obtener analítica temporal (admin)
  Future<AnaliticaTemporal> getAnalytics({String scope = 'today'}) async {
    final response = await _apiService.get(
      ApiConstants.analyticsEndpoint,
      queryParameters: {'scope': scope},
    );
    return AnaliticaTemporal.fromJson(response.data);
  }

  // Obtener alertas para reportes (admin)
  Future<AlertasReporte> getAlerts({String? rango, int? dias}) async {
    final queryParams = <String, dynamic>{};
    if (rango != null) queryParams['rango'] = rango;
    if (dias != null) queryParams['dias'] = dias;

    final response = await _apiService.get(
      ApiConstants.alertsEndpoint,
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    return AlertasReporte.fromJson(response.data);
  }

  // Obtener reporte de usuarios (admin)
  Future<UsuariosReporte> getUsersReport() async {
    final response = await _apiService.get(ApiConstants.usersReportEndpoint);
    return UsuariosReporte.fromJson(response.data);
  }

  // Obtener reporte de sensores (admin)
  Future<SensoresReporte> getSensorsReport() async {
    final response = await _apiService.get(ApiConstants.sensorsReportEndpoint);
    return SensoresReporte.fromJson(response.data);
  }
}
