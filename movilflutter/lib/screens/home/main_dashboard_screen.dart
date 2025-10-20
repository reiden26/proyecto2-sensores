import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/reading_chart.dart';
import '../../services/export_service.dart';
import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/rendering.dart';
// import '../../models/lectura.dart';

class MainDashboardScreen extends ConsumerStatefulWidget {
  const MainDashboardScreen({super.key});

  @override
  ConsumerState<MainDashboardScreen> createState() =>
      _MainDashboardScreenState();
}

class _MainDashboardScreenState extends ConsumerState<MainDashboardScreen> {
  String _selectedTimeFilter = '2h';
  int _selectedLimit = 15;

  Map<String, int> _timeFilters = {'2h': 15, '6h': 30, '24h': 50, '7d': 100};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(sensorCaptureStateProvider.notifier).refresh();
      ref.invalidate(myReadingsProvider(_selectedLimit));
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final sensorCaptureState = ref.watch(sensorCaptureStateProvider);
    final myReadingsAsync = ref.watch(myReadingsProvider(_selectedLimit));
    final dashboardMetricsAsync = ref.watch(dashboardMetricsProvider);

    // Claves para capturar cada gráfico individualmente
    final mq135Key = GlobalKey();
    final mq4Key = GlobalKey();
    final mq7Key = GlobalKey();

    Future<Uint8List?> _capture(GlobalKey key, {double ratio = 3.0}) async {
      try {
        final boundary =
            key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
        if (boundary == null) return null;
        final image = await boundary.toImage(pixelRatio: ratio);
        final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
        return byteData?.buffer.asUint8List();
      } catch (_) {
        return null;
      }
    }

    final lastUpdate =
        "Última actualización: ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}";

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard de Sensores'),
        actions: [
          IconButton(
            tooltip: 'Exportar',
            icon: const Icon(Icons.ios_share),
            onPressed: () async {
              final readings = await myReadingsAsync
                  .whenData((r) => r)
                  .valueOrNull;
              if (readings == null) return;

              // 1) Elegir formato primero
              final action = await showModalBottomSheet<String>(
                context: context,
                builder: (ctx) {
                  return SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ListTile(
                          leading: const Icon(Icons.picture_as_pdf),
                          title: const Text('Exportar como PDF'),
                          onTap: () => Navigator.pop(ctx, 'pdf'),
                        ),
                        ListTile(
                          leading: const Icon(Icons.grid_on),
                          title: const Text('Exportar como Excel'),
                          onTap: () => Navigator.pop(ctx, 'excel'),
                        ),
                      ],
                    ),
                  );
                },
              );

              if (action == null) return; // cancelado

              // 2) Mostrar indicador indeterminado (Material 3)
              await Future.delayed(const Duration(milliseconds: 150));
              showDialog(
                context: context,
                useRootNavigator: true,
                barrierDismissible: false,
                builder: (dialogCtx) => AlertDialog(
                  title: const Text('Generando exportación...'),
                  content: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 3),
                      ),
                      SizedBox(width: 12),
                      Expanded(child: Text('Por favor espera')),
                    ],
                  ),
                ),
              );
              // Dar tiempo al cuadro de diálogo para pintar el primer frame
              await Future.delayed(const Duration(milliseconds: 250));

              // 3) Capturar imágenes solo de los gráficos
              // Pequeños yields para no bloquear el hilo de UI y permitir animación del spinner
              final mq135Img = await _capture(mq135Key, ratio: 2.5);
              await Future.delayed(const Duration(milliseconds: 16));
              final mq4Img = await _capture(mq4Key, ratio: 2.5);
              await Future.delayed(const Duration(milliseconds: 16));
              final mq7Img = await _capture(mq7Key, ratio: 2.5);
              await Future.delayed(const Duration(milliseconds: 16));

              final series = <String, List<num>>{
                if (readings.mq135.isNotEmpty)
                  'MQ-135': readings.mq135
                      .where((e) => e.valor != null)
                      .map((e) => (e.valor ?? 0).toDouble())
                      .toList(),
                if (readings.mq4.isNotEmpty)
                  'MQ-4': readings.mq4
                      .where((e) => e.valor != null)
                      .map((e) => (e.valor ?? 0).toDouble())
                      .toList(),
                if (readings.mq7.isNotEmpty)
                  'MQ-7': readings.mq7
                      .where((e) => e.valor != null)
                      .map((e) => (e.valor ?? 0).toDouble())
                      .toList(),
              };

              final chartImages = <String, Uint8List>{
                if (mq135Img != null) 'MQ-135 - Calidad del Aire': mq135Img,
                if (mq4Img != null) 'MQ-4 - Gas Metano': mq4Img,
                if (mq7Img != null) 'MQ-7 - Monóxido de Carbono': mq7Img,
              };

              // 4) Generar según formato en tarea separada para no bloquear el handler
              // Cerrar el diálogo cuando termine
              Future<void>(() async {
                try {
                  if (action == 'pdf') {
                    await Future.delayed(const Duration(milliseconds: 16));
                    await ExportService.exportPdf(
                      fileName: 'lecturas_${_selectedTimeFilter}',
                      title: 'Lecturas recientes (${_selectedTimeFilter})',
                      series: series,
                      chartImages: chartImages,
                    );
                  } else if (action == 'excel') {
                    await Future.delayed(const Duration(milliseconds: 16));
                    await ExportService.exportExcel(
                      fileName: 'lecturas_${_selectedTimeFilter}',
                      series: series,
                      chartImages: chartImages,
                    );
                  }
                } finally {
                  if (mounted) {
                    Navigator.of(context, rootNavigator: true).pop();
                  }
                }
              });

              // Salir del onPressed dejando el diálogo animando
              return;
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Saludo
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      backgroundImage:
                          authState.user?.imagenUrl != null &&
                              authState.user!.imagenUrl!.isNotEmpty
                          ? NetworkImage(authState.user!.imagenUrl!)
                          : null,
                      child:
                          authState.user?.imagenUrl == null ||
                              authState.user!.imagenUrl!.isEmpty
                          ? Text(
                              authState.user?.nombre
                                      .substring(0, 1)
                                      .toUpperCase() ??
                                  'U',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hola, ${authState.user?.nombre ?? 'Usuario'}',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            lastUpdate,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface.withOpacity(0.7),
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Métricas
            dashboardMetricsAsync.when(
              data: (metrics) => Row(
                children: [
                  Expanded(
                    child: _MetricCard(
                      title: 'Sensores activos',
                      value: _countActive(sensorCaptureState).toString(),
                      icon: Icons.sensors,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      title: 'Datos de hoy',
                      value: '${metrics.todayDataCount}',
                      icon: Icons.today,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      title: 'Estado',
                      value: metrics.systemStatus,
                      icon: _getSystemStatusIcon(metrics.systemStatus),
                      color: _getSystemStatusColor(metrics.systemStatus),
                    ),
                  ),
                ],
              ),
              loading: () => Row(
                children: [
                  Expanded(
                    child: _MetricCard(
                      title: 'Sensores activos',
                      value: _countActive(sensorCaptureState).toString(),
                      icon: Icons.sensors,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      title: 'Datos de hoy',
                      value: '...',
                      icon: Icons.today,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      title: 'Estado',
                      value: 'Cargando...',
                      icon: Icons.help,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
              error: (error, stack) => Row(
                children: [
                  Expanded(
                    child: _MetricCard(
                      title: 'Sensores activos',
                      value: _countActive(sensorCaptureState).toString(),
                      icon: Icons.sensors,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      title: 'Datos de hoy',
                      value: 'Error',
                      icon: Icons.today,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      title: 'Estado',
                      value: 'Error',
                      icon: Icons.error,
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Selector de tiempo
            Row(
              children: [
                Text(
                  'Lecturas Recientes',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                DropdownButton<String>(
                  value: _selectedTimeFilter,
                  items: _timeFilters.keys.map((filter) {
                    return DropdownMenuItem<String>(
                      value: filter,
                      child: Text(filter),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedTimeFilter = value;
                        _selectedLimit = _timeFilters[value]!;
                      });
                      ref.invalidate(myReadingsProvider(_selectedLimit));
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),

            myReadingsAsync.when(
              data: (readings) => Column(
                children: [
                  if (readings.mq135.isNotEmpty)
                    ReadingChart(
                      title: 'MQ-135 - Calidad del Aire',
                      readings: readings.mq135,
                      color: Colors.red,
                      captureKey: mq135Key,
                    ),
                  const SizedBox(height: 16),
                  if (readings.mq4.isNotEmpty)
                    ReadingChart(
                      title: 'MQ-4 - Gas Metano',
                      readings: readings.mq4,
                      color: Colors.blue,
                      captureKey: mq4Key,
                    ),
                  const SizedBox(height: 16),
                  if (readings.mq7.isNotEmpty)
                    ReadingChart(
                      title: 'MQ-7 - Monóxido de Carbono',
                      readings: readings.mq7,
                      color: Colors.amber,
                      captureKey: mq7Key,
                    ),
                  if (readings.mq135.isEmpty &&
                      readings.mq4.isEmpty &&
                      readings.mq7.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'Sin lecturas disponibles. Activa los sensores para comenzar a recibir datos.',
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Error al cargar las lecturas: $e'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _countActive(SensorCaptureState state) {
    return state.sensorStates.values.where((v) => v == true).length;
  }

  IconData _getSystemStatusIcon(String status) {
    switch (status) {
      case 'Operativo':
        return Icons.check_circle;
      case 'Parcial':
      case 'Atención':
        return Icons.warning;
      case 'Inactivo':
        return Icons.error;
      default:
        return Icons.help;
    }
  }

  Color _getSystemStatusColor(String status) {
    switch (status) {
      case 'Operativo':
        return Colors.green;
      case 'Parcial':
      case 'Atención':
        return Colors.orange;
      case 'Inactivo':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const Spacer(),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'LIVE',
                      style: TextStyle(
                        color: color,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}
