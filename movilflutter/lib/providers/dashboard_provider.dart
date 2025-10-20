import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'sensor_provider.dart';

// Estado de las métricas del dashboard
class DashboardMetrics {
  final int todayDataCount;
  final String lastUpdateTime;
  final String systemStatus;
  final bool isLoading;

  const DashboardMetrics({
    required this.todayDataCount,
    required this.lastUpdateTime,
    required this.systemStatus,
    this.isLoading = false,
  });

  DashboardMetrics copyWith({
    int? todayDataCount,
    String? lastUpdateTime,
    String? systemStatus,
    bool? isLoading,
  }) {
    return DashboardMetrics(
      todayDataCount: todayDataCount ?? this.todayDataCount,
      lastUpdateTime: lastUpdateTime ?? this.lastUpdateTime,
      systemStatus: systemStatus ?? this.systemStatus,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// Provider para las métricas del dashboard
final dashboardMetricsProvider = FutureProvider<DashboardMetrics>((ref) async {
  // Obtener lecturas para calcular métricas
  final readingsAsync = ref.watch(myReadingsProvider(1000));

  return readingsAsync.when(
    data: (readings) {
      // Calcular datos de hoy
      final today = DateTime.now();
      int todayCount = 0;

      for (final reading in readings.mq135) {
        if (reading.creadoEn.day == today.day &&
            reading.creadoEn.month == today.month &&
            reading.creadoEn.year == today.year) {
          todayCount++;
        }
      }

      for (final reading in readings.mq4) {
        if (reading.creadoEn.day == today.day &&
            reading.creadoEn.month == today.month &&
            reading.creadoEn.year == today.year) {
          todayCount++;
        }
      }

      for (final reading in readings.mq7) {
        if (reading.creadoEn.day == today.day &&
            reading.creadoEn.month == today.month &&
            reading.creadoEn.year == today.year) {
          todayCount++;
        }
      }

      // Calcular última actualización
      DateTime? latestTime;

      for (final reading in readings.mq135) {
        if (latestTime == null || reading.creadoEn.isAfter(latestTime)) {
          latestTime = reading.creadoEn;
        }
      }

      for (final reading in readings.mq4) {
        if (latestTime == null || reading.creadoEn.isAfter(latestTime)) {
          latestTime = reading.creadoEn;
        }
      }

      for (final reading in readings.mq7) {
        if (latestTime == null || reading.creadoEn.isAfter(latestTime)) {
          latestTime = reading.creadoEn;
        }
      }

      String lastUpdate = 'Sin datos';
      if (latestTime != null) {
        final now = DateTime.now();
        final difference = now.difference(latestTime);

        if (difference.inMinutes < 1) {
          lastUpdate = 'Hace un momento';
        } else if (difference.inMinutes < 60) {
          lastUpdate = 'Hace ${difference.inMinutes}m';
        } else if (difference.inHours < 24) {
          lastUpdate = 'Hace ${difference.inHours}h';
        } else {
          lastUpdate = 'Hace ${difference.inDays}d';
        }
      }

      // Obtener estado del sistema
      final sensorState = ref.read(sensorCaptureStateProvider);
      final activeSensors = sensorState.sensorStates.values
          .where((e) => e)
          .length;

      String systemStatus;
      if (activeSensors == 0) {
        systemStatus = 'Inactivo';
      } else if (activeSensors == 3) {
        systemStatus = 'Operativo';
      } else {
        systemStatus = 'Parcial';
      }

      return DashboardMetrics(
        todayDataCount: todayCount,
        lastUpdateTime: lastUpdate,
        systemStatus: systemStatus,
        isLoading: false,
      );
    },
    loading: () => const DashboardMetrics(
      todayDataCount: 0,
      lastUpdateTime: 'Cargando...',
      systemStatus: 'Verificando...',
      isLoading: true,
    ),
    error: (error, stack) => const DashboardMetrics(
      todayDataCount: 0,
      lastUpdateTime: 'Error',
      systemStatus: 'Error',
      isLoading: false,
    ),
  );
});
