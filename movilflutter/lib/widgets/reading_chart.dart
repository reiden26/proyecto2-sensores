import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/lectura.dart';
import 'package:flutter/rendering.dart';

// ChartCaptureScope removed; using external RepaintBoundary key at screen level

class ReadingChart extends StatelessWidget {
  final List<Lectura> readings;
  final String title;
  final Color color;
  final GlobalKey? captureKey; // para exportación

  const ReadingChart({
    super.key,
    required this.readings,
    required this.color,
    this.title = 'Lecturas del Sensor',
    this.captureKey,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Filtrar lecturas con valores válidos
    final validReadings = readings.where((r) => r.valor != null).toList();

    if (validReadings.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                height: 200,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest.withOpacity(
                    0.3,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.show_chart,
                        size: 48,
                        color: theme.colorScheme.onSurface.withOpacity(0.5),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No hay datos disponibles',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    try {
      final minY = _getMinValue(validReadings);
      final maxY = _getMaxValue(validReadings);
      final interval = _calculateInterval(validReadings);

      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 200,
                child: RepaintBoundary(
                  key: captureKey,
                  child: LineChart(
                    LineChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: interval,
                        getDrawingHorizontalLine: (value) {
                          return FlLine(
                            color: theme.colorScheme.outline.withOpacity(0.2),
                            strokeWidth: 1,
                          );
                        },
                      ),
                      titlesData: FlTitlesData(
                        show: true,
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        bottomTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            interval: _calculateInterval(validReadings),
                            getTitlesWidget: (value, meta) {
                              return Text(
                                value.toInt().toString(),
                                style: theme.textTheme.bodySmall,
                              );
                            },
                          ),
                        ),
                      ),
                      borderData: FlBorderData(
                        show: true,
                        border: Border.all(
                          color: theme.colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      minX: 0,
                      maxX: (validReadings.length - 1).toDouble(),
                      minY: minY,
                      maxY: maxY,
                      lineBarsData: [
                        LineChartBarData(
                          spots: _getSpots(validReadings),
                          isCurved: true,
                          color: color,
                          barWidth: 2,
                          isStrokeCapRound: true,
                          dotData: FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, barData, index) {
                              return FlDotCirclePainter(
                                radius: 4,
                                color: color,
                                strokeWidth: 2,
                                strokeColor: theme.colorScheme.surface,
                              );
                            },
                          ),
                          belowBarData: BarAreaData(
                            show: true,
                            color: color.withOpacity(0.1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              _buildLegend(theme, validReadings),
            ],
          ),
        ),
      );
    } catch (e) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Error al renderizar gráfico: $e',
                style: TextStyle(color: theme.colorScheme.error),
              ),
            ],
          ),
        ),
      );
    }
  }

  List<FlSpot> _getSpots(List<Lectura> validReadings) {
    if (validReadings.isEmpty) return [];
    return validReadings.asMap().entries.map((entry) {
      final double y = (entry.value.valor ?? 0).toDouble();
      return FlSpot(entry.key.toDouble(), y);
    }).toList();
  }

  double _getMinValue(List<Lectura> validReadings) {
    if (validReadings.isEmpty) return 0;
    final values = validReadings
        .map((r) => r.valor)
        .whereType<num>()
        .map((n) => n.toDouble())
        .toList();
    if (values.isEmpty) return 0;
    final min = values.reduce((a, b) => a < b ? a : b);
    return min * 0.9;
  }

  double _getMaxValue(List<Lectura> validReadings) {
    if (validReadings.isEmpty) return 100;
    final values = validReadings
        .map((r) => r.valor)
        .whereType<num>()
        .map((n) => n.toDouble())
        .toList();
    if (values.isEmpty) return 100;
    final max = values.reduce((a, b) => a > b ? a : b);
    return max * 1.1;
  }

  double _calculateInterval(List<Lectura> validReadings) {
    final range = _getMaxValue(validReadings) - _getMinValue(validReadings);
    if (range <= 0) return 1;
    final step = (range / 4).clamp(1, double.infinity);
    return step.roundToDouble();
  }

  Widget _buildLegend(ThemeData theme, List<Lectura> validReadings) {
    if (validReadings.isEmpty) return const SizedBox.shrink();
    final values = validReadings
        .map((r) => r.valor)
        .whereType<num>()
        .map((n) => n.toDouble())
        .toList();
    if (values.isEmpty) return const SizedBox.shrink();
    final latest = values.last;
    final average = values.isNotEmpty
        ? values.reduce((a, b) => a + b) / values.length
        : 0.0;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildLegendItem(
          'Último',
          latest.toStringAsFixed(2),
          theme.colorScheme.primary,
          theme,
        ),
        _buildLegendItem(
          'Promedio',
          average.toStringAsFixed(2),
          theme.colorScheme.secondary,
          theme,
        ),
        _buildLegendItem(
          'Total',
          '${validReadings.length}',
          theme.colorScheme.tertiary,
          theme,
        ),
      ],
    );
  }

  Widget _buildLegendItem(
    String label,
    String value,
    Color color,
    ThemeData theme,
  ) {
    return Column(
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
