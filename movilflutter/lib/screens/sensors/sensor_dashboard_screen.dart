import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/auth_provider.dart';
// import '../../models/lectura.dart';
import '../../widgets/sensor_card.dart';
import '../../widgets/reading_chart.dart';
import '../../widgets/action_button.dart';

class SensorDashboardScreen extends ConsumerStatefulWidget {
  const SensorDashboardScreen({super.key});

  @override
  ConsumerState<SensorDashboardScreen> createState() =>
      _SensorDashboardScreenState();
}

class _SensorDashboardScreenState extends ConsumerState<SensorDashboardScreen> {
  String _selectedTimeFilter = '24h';
  int _selectedLimit = 24; // alineado con la app web por defecto

  Map<String, int> _timeFilters = {'1h': 12, '24h': 24, '7d': 28, '30d': 30};

  @override
  void initState() {
    super.initState();
    // Refrescar datos al cargar la pantalla
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(sensorCaptureStateProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final sensorCaptureState = ref.watch(sensorCaptureStateProvider);
    final myReadingsAsync = ref.watch(myReadingsProvider(_selectedLimit));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard de Sensores'),
        actions: [
          AppBarActionButton(
            label: 'Activar todos',
            icon: Icons.play_circle_fill,
            type: ActionButtonType.success,
            isLoading: sensorCaptureState.isLoading,
            onPressed: () async {
              await ref.read(sensorCaptureStateProvider.notifier).activateAll();
              ref.read(sensorCaptureStateProvider.notifier).refresh();
              ref.invalidate(myReadingsProvider);
              final st = ref.read(sensorCaptureStateProvider);
              final anyNotConnected = [
                'mq135',
                'mq4',
                'mq7',
              ].any((c) => !(st.connectionStates[c] ?? false));
              if (anyNotConnected) _showDeviceNotConnectedSnack();
            },
          ),
          AppBarActionButton(
            label: 'Desactivar todos',
            icon: Icons.stop_circle,
            type: ActionButtonType.danger,
            isLoading: sensorCaptureState.isLoading,
            onPressed: () async {
              await ref
                  .read(sensorCaptureStateProvider.notifier)
                  .deactivateAll();
              ref.read(sensorCaptureStateProvider.notifier).refresh();
              ref.invalidate(myReadingsProvider);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Saludo removido: ya existe en Dashboard

            // Estado de sensores
            Text(
              'Estado de Sensores',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            if (sensorCaptureState.isLoading)
              const Center(child: CircularProgressIndicator())
            else
              Column(
                children: [
                  // Sensor MQ-135 (Calidad del aire)
                  SensorCard(
                    sensorCode: 'mq135',
                    sensorName: 'MQ-135',
                    sensorDescription: 'Calidad del Aire / CO₂',
                    isActive: sensorCaptureState.sensorStates['mq135'] ?? false,
                    isConnected:
                        sensorCaptureState.connectionStates['mq135'] ?? false,
                    onToggle: (isActive) async {
                      if (isActive) {
                        await ref
                            .read(sensorCaptureStateProvider.notifier)
                            .activateCapture('mq135');
                        final connected =
                            ref
                                .read(sensorCaptureStateProvider)
                                .connectionStates['mq135'] ??
                            false;
                        if (!connected) _showDeviceNotConnectedSnack();
                      } else {
                        await ref
                            .read(sensorCaptureStateProvider.notifier)
                            .deactivateCapture('mq135');
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // Sensor MQ-4 (Metano)
                  SensorCard(
                    sensorCode: 'mq4',
                    sensorName: 'MQ-4',
                    sensorDescription: 'Gas Metano',
                    isActive: sensorCaptureState.sensorStates['mq4'] ?? false,
                    isConnected:
                        sensorCaptureState.connectionStates['mq4'] ?? false,
                    onToggle: (isActive) async {
                      if (isActive) {
                        await ref
                            .read(sensorCaptureStateProvider.notifier)
                            .activateCapture('mq4');
                        final connected =
                            ref
                                .read(sensorCaptureStateProvider)
                                .connectionStates['mq4'] ??
                            false;
                        if (!connected) _showDeviceNotConnectedSnack();
                      } else {
                        await ref
                            .read(sensorCaptureStateProvider.notifier)
                            .deactivateCapture('mq4');
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // Sensor MQ-7 (Monóxido de carbono)
                  SensorCard(
                    sensorCode: 'mq7',
                    sensorName: 'MQ-7',
                    sensorDescription: 'Monóxido de Carbono',
                    isActive: sensorCaptureState.sensorStates['mq7'] ?? false,
                    isConnected:
                        sensorCaptureState.connectionStates['mq7'] ?? false,
                    onToggle: (isActive) async {
                      if (isActive) {
                        await ref
                            .read(sensorCaptureStateProvider.notifier)
                            .activateCapture('mq7');
                        final connected =
                            ref
                                .read(sensorCaptureStateProvider)
                                .connectionStates['mq7'] ??
                            false;
                        if (!connected) _showDeviceNotConnectedSnack();
                      } else {
                        await ref
                            .read(sensorCaptureStateProvider.notifier)
                            .deactivateCapture('mq7');
                      }
                    },
                  ),
                ],
              ),

            const SizedBox(height: 24),

            // Selector de tiempo y cantidad de datos
            Row(
              children: [
                Text(
                  'Análisis de Datos',
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
                      child: Text('$filter (${_timeFilters[filter]} lecturas)'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedTimeFilter = value;
                        _selectedLimit = _timeFilters[value]!;
                      });
                      ref.invalidate(myReadingsProvider);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),

            myReadingsAsync.when(
              data: (readings) {
                if (readings.mq135.isEmpty &&
                    readings.mq4.isEmpty &&
                    readings.mq7.isEmpty) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Icon(
                            Icons.sensors_off,
                            size: 48,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No hay lecturas disponibles',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Activa los sensores para comenzar a recibir datos',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface.withOpacity(0.7),
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return Column(
                  children: [
                    if (readings.mq135.isNotEmpty)
                      ReadingChart(
                        title: 'MQ-135 - Calidad del Aire',
                        readings: readings.mq135,
                        color: Colors.red,
                      ),
                    const SizedBox(height: 16),
                    if (readings.mq4.isNotEmpty)
                      ReadingChart(
                        title: 'MQ-4 - Gas Metano',
                        readings: readings.mq4,
                        color: Colors.blue,
                      ),
                    const SizedBox(height: 16),
                    if (readings.mq7.isNotEmpty)
                      ReadingChart(
                        title: 'MQ-7 - Monóxido de Carbono',
                        readings: readings.mq7,
                        color: Colors.amber,
                      ),
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Error al cargar las lecturas: $error',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              ),
            ),

            // Mostrar error si existe
            if (sensorCaptureState.error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  sensorCaptureState.error!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onErrorContainer,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showDeviceNotConnectedSnack() {
    final theme = Theme.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: theme.colorScheme.errorContainer,
        content: Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: theme.colorScheme.onErrorContainer,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'No se detectó conexión con el dispositivo (ESP32). Verifica el hardware y la red.',
                style: TextStyle(color: theme.colorScheme.onErrorContainer),
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'REINTENTAR',
          textColor: theme.colorScheme.onErrorContainer,
          onPressed: () {
            ref.read(sensorCaptureStateProvider.notifier).refresh();
          },
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}
