import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../models/lectura.dart';
import 'package:intl/intl.dart';
import '../../services/export_service.dart';

class UserDataScreen extends ConsumerStatefulWidget {
  const UserDataScreen({super.key});

  @override
  ConsumerState<UserDataScreen> createState() => _UserDataScreenState();
}

typedef WidgetRefRead = T Function<T>(ProviderListenable<T> provider);

class _UserDataScreenState extends ConsumerState<UserDataScreen> {
  // Filtros temporales (lo que el usuario está seleccionando)
  String _tempSelectedSensor = 'Todos';
  String _tempSelectedStatus = 'Todos';
  DateTime? _tempStartDate;
  DateTime? _tempEndDate;

  // Filtros aplicados (lo que realmente se usa para filtrar)
  String _appliedSensor = 'Todos';
  String _appliedStatus = 'Todos';
  DateTime? _appliedStartDate;
  DateTime? _appliedEndDate;

  int _currentPage = 0;
  final int _itemsPerPage = 20;
  bool _filtersExpanded = false;

  final List<String> _sensorOptions = ['Todos', 'MQ-135', 'MQ-4', 'MQ-7'];
  final List<String> _statusOptions = ['Todos', 'Bueno', 'Advertencia', 'Malo'];

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;
    final myReadingsAsync = ref.watch(
      myReadingsProvider(1000),
    ); // Obtener todas las lecturas

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Datos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () => _showExportDialog(context),
          ),
        ],
      ),
      body: user == null
          ? const Center(child: Text('No hay datos de usuario disponibles.'))
          : Column(
              children: [
                // Filtros
                _buildFiltersCard(),

                // Tabla de datos
                Expanded(
                  child: myReadingsAsync.when(
                    data: (readings) => _buildDataTable(readings),
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (error, stack) =>
                        Center(child: Text('Error al cargar datos: $error')),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildFiltersCard() {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          // Header con botón de expandir/colapsar
          InkWell(
            onTap: () {
              setState(() {
                _filtersExpanded = !_filtersExpanded;
              });
            },
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.tune,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Filtros',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          _getAppliedFiltersCount() > 0
                              ? '${_getAppliedFiltersCount()} filtros activos'
                              : 'Sin filtros aplicados',
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
                  AnimatedRotation(
                    turns: _filtersExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.expand_more,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Contenido expandible
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            height: _filtersExpanded ? null : 0,
            child: _filtersExpanded
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Column(
                      children: [
                        const Divider(),
                        const SizedBox(height: 16),

                        // Filtros principales
                        Row(
                          children: [
                            Expanded(
                              child: _buildModernDropdown(
                                label: 'Sensor',
                                value: _tempSelectedSensor,
                                items: _sensorOptions,
                                onChanged: (value) {
                                  setState(() {
                                    _tempSelectedSensor = value!;
                                  });
                                },
                                icon: Icons.sensors,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildModernDropdown(
                                label: 'Estado',
                                value: _tempSelectedStatus,
                                items: _statusOptions,
                                onChanged: (value) {
                                  setState(() {
                                    _tempSelectedStatus = value!;
                                  });
                                },
                                icon: Icons.flag,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Filtros de fecha
                        Row(
                          children: [
                            Expanded(
                              child: _buildModernDateField(
                                label: 'Fecha desde',
                                date: _tempStartDate,
                                onTap: () => _selectTempStartDate(context),
                                icon: Icons.calendar_today,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildModernDateField(
                                label: 'Fecha hasta',
                                date: _tempEndDate,
                                onTap: () => _selectTempEndDate(context),
                                icon: Icons.calendar_today,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Botones de acción
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _clearFilters,
                                icon: const Icon(Icons.clear_all, size: 18),
                                label: const Text('Limpiar'),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton.icon(
                                onPressed: _applyFilters,
                                icon: const Icon(Icons.search, size: 18),
                                label: const Text('Aplicar'),
                                style: FilledButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildModernDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w500),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: items.map((item) {
              return DropdownMenuItem(value: item, child: Text(item));
            }).toList(),
            onChanged: onChanged,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }

  Widget _buildModernDateField({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w500),
            ),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(
                color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    date != null
                        ? DateFormat('dd/MM/yyyy').format(date)
                        : 'Seleccionar fecha',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: date != null
                          ? Theme.of(context).colorScheme.onSurface
                          : Theme.of(
                              context,
                            ).colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ),
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  int _getAppliedFiltersCount() {
    int count = 0;
    if (_appliedSensor != 'Todos') count++;
    if (_appliedStatus != 'Todos') count++;
    if (_appliedStartDate != null) count++;
    if (_appliedEndDate != null) count++;
    return count;
  }

  void _applyFilters() {
    setState(() {
      _appliedSensor = _tempSelectedSensor;
      _appliedStatus = _tempSelectedStatus;
      _appliedStartDate = _tempStartDate;
      _appliedEndDate = _tempEndDate;
      _currentPage = 0;
      _filtersExpanded = false; // Ocultar filtros después de aplicar
    });
  }

  void _clearFilters() {
    setState(() {
      _tempSelectedSensor = 'Todos';
      _tempSelectedStatus = 'Todos';
      _tempStartDate = null;
      _tempEndDate = null;
      _appliedSensor = 'Todos';
      _appliedStatus = 'Todos';
      _appliedStartDate = null;
      _appliedEndDate = null;
      _currentPage = 0;
    });
  }

  Future<void> _selectTempStartDate(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: _tempStartDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _tempStartDate = date;
      });
    }
  }

  Future<void> _selectTempEndDate(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: _tempEndDate ?? DateTime.now(),
      firstDate: _tempStartDate ?? DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _tempEndDate = date;
      });
    }
  }

  Widget _buildDataTable(LecturasUsuario readings) {
    // Combinar todas las lecturas
    List<Map<String, dynamic>> allReadings = [];

    readings.mq135.forEach((reading) {
      allReadings.add({
        'id': reading.id,
        'sensor': 'MQ-135',
        'valor': reading.valor,
        'estado': reading.estado.name,
        'fecha': reading.creadoEn,
        'sensor_codigo': 'mq135',
      });
    });

    readings.mq4.forEach((reading) {
      allReadings.add({
        'id': reading.id,
        'sensor': 'MQ-4',
        'valor': reading.valor,
        'estado': reading.estado.name,
        'fecha': reading.creadoEn,
        'sensor_codigo': 'mq4',
      });
    });

    readings.mq7.forEach((reading) {
      allReadings.add({
        'id': reading.id,
        'sensor': 'MQ-7',
        'valor': reading.valor,
        'estado': reading.estado.name,
        'fecha': reading.creadoEn,
        'sensor_codigo': 'mq7',
      });
    });

    // Aplicar filtros
    List<Map<String, dynamic>> filteredReadings = allReadings.where((reading) {
      bool sensorMatch =
          _appliedSensor == 'Todos' || reading['sensor'] == _appliedSensor;
      bool statusMatch =
          _appliedStatus == 'Todos' ||
          reading['estado'].toLowerCase() == _appliedStatus.toLowerCase();
      bool dateMatch = true;

      if (_appliedStartDate != null) {
        dateMatch = dateMatch && reading['fecha'].isAfter(_appliedStartDate!);
      }
      if (_appliedEndDate != null) {
        dateMatch =
            dateMatch &&
            reading['fecha'].isBefore(
              _appliedEndDate!.add(const Duration(days: 1)),
            );
      }

      return sensorMatch && statusMatch && dateMatch;
    }).toList();

    // Ordenar por fecha descendente
    filteredReadings.sort((a, b) => b['fecha'].compareTo(a['fecha']));

    // Paginación
    final totalPages = (filteredReadings.length / _itemsPerPage).ceil();
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(
      0,
      filteredReadings.length,
    );
    final paginatedReadings = filteredReadings.sublist(startIndex, endIndex);

    return Column(
      children: [
        // Tabla con diseño moderno
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
              ),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: MaterialStateProperty.all(
                  Theme.of(context).colorScheme.surfaceContainerHighest,
                ),
                dataRowMinHeight: 56,
                dataRowMaxHeight: 56,
                columnSpacing: 24,
                horizontalMargin: 16,
                columns: [
                  DataColumn(
                    label: Row(
                      children: [
                        Icon(
                          Icons.tag,
                          size: 16,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'ID',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  DataColumn(
                    label: Row(
                      children: [
                        Icon(
                          Icons.sensors,
                          size: 16,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Sensor',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  DataColumn(
                    label: Row(
                      children: [
                        Icon(
                          Icons.analytics,
                          size: 16,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Valor',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  DataColumn(
                    label: Row(
                      children: [
                        Icon(
                          Icons.flag,
                          size: 16,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Estado',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  DataColumn(
                    label: Row(
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 16,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Fecha',
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
                rows: paginatedReadings.map((reading) {
                  return DataRow(
                    cells: [
                      DataCell(
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Theme.of(
                              context,
                            ).colorScheme.primaryContainer.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            reading['id'].toString(),
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(fontWeight: FontWeight.w500),
                          ),
                        ),
                      ),
                      DataCell(
                        Row(
                          children: [
                            Icon(
                              _getSensorIcon(reading['sensor_codigo']),
                              size: 16,
                              color: _getSensorColor(reading['sensor_codigo']),
                            ),
                            const SizedBox(width: 6),
                            Text(reading['sensor']),
                          ],
                        ),
                      ),
                      DataCell(
                        Text(
                          _formatValor(reading['valor']),
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(fontWeight: FontWeight.w500),
                        ),
                      ),
                      DataCell(
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _getStatusColor(
                              reading['estado'],
                            ).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: _getStatusColor(
                                reading['estado'],
                              ).withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            reading['estado'],
                            style: TextStyle(
                              color: _getStatusColor(reading['estado']),
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                      DataCell(
                        Text(
                          DateFormat(
                            'dd/MM/yyyy HH:mm',
                          ).format(reading['fecha']),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ),

        // Paginación simplificada
        if (totalPages > 1)
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Botón anterior
                IconButton.filled(
                  onPressed: _currentPage > 0
                      ? () {
                          setState(() {
                            _currentPage--;
                          });
                        }
                      : null,
                  icon: const Icon(Icons.chevron_left),
                  style: IconButton.styleFrom(
                    backgroundColor: _currentPage > 0
                        ? Theme.of(context).colorScheme.primaryContainer
                        : Theme.of(context).colorScheme.surfaceContainerHighest,
                    foregroundColor: _currentPage > 0
                        ? Theme.of(context).colorScheme.onPrimaryContainer
                        : Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.3),
                  ),
                ),

                // Indicador de página actual
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_currentPage + 1} / $totalPages',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),

                // Botón siguiente
                IconButton.filled(
                  onPressed: _currentPage < totalPages - 1
                      ? () {
                          setState(() {
                            _currentPage++;
                          });
                        }
                      : null,
                  icon: const Icon(Icons.chevron_right),
                  style: IconButton.styleFrom(
                    backgroundColor: _currentPage < totalPages - 1
                        ? Theme.of(context).colorScheme.primaryContainer
                        : Theme.of(context).colorScheme.surfaceContainerHighest,
                    foregroundColor: _currentPage < totalPages - 1
                        ? Theme.of(context).colorScheme.onPrimaryContainer
                        : Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.3),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'bueno':
        return Colors.green;
      case 'advertencia':
        return Colors.orange;
      case 'malo':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getSensorIcon(String sensorCode) {
    switch (sensorCode.toLowerCase()) {
      case 'mq135':
        return Icons.air;
      case 'mq4':
        return Icons.local_gas_station;
      case 'mq7':
        return Icons.smoke_free;
      default:
        return Icons.sensors;
    }
  }

  Color _getSensorColor(String sensorCode) {
    switch (sensorCode.toLowerCase()) {
      case 'mq135':
        return Colors.red;
      case 'mq4':
        return Colors.blue;
      case 'mq7':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }

  String _formatValor(dynamic valor) {
    if (valor == null) return 'N/A';
    if (valor is num) {
      return (valor).toStringAsFixed(2);
    }
    // Try parse if it comes as string
    final parsed = double.tryParse(valor.toString());
    if (parsed == null) return 'N/A';
    return parsed.toStringAsFixed(2);
  }

  void _showExportDialog(BuildContext context) {
    showModalBottomSheet<String>(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.insert_drive_file),
                title: const Text('Exportar como CSV'),
                onTap: () => Navigator.pop(ctx, 'csv'),
              ),
              ListTile(
                leading: const Icon(Icons.insert_drive_file),
                title: const Text('Exportar como CSV (coma decimal)'),
                subtitle: const Text('Usa "," como separador decimal'),
                onTap: () => Navigator.pop(ctx, 'csv_comma'),
              ),
              ListTile(
                leading: const Icon(Icons.data_object),
                title: const Text('Exportar como JSON'),
                onTap: () => Navigator.pop(ctx, 'json'),
              ),
              ListTile(
                leading: const Icon(Icons.grid_on),
                title: const Text('Exportar como Excel'),
                onTap: () => Navigator.pop(ctx, 'excel'),
              ),
              ListTile(
                leading: const Icon(Icons.picture_as_pdf),
                title: const Text('Exportar como PDF'),
                onTap: () => Navigator.pop(ctx, 'pdf'),
              ),
            ],
          ),
        );
      },
    ).then((action) async {
      if (action == null) return;

      // Mostrar spinner como en dashboard
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
      await Future.delayed(const Duration(milliseconds: 200));

      // Construir filas según tabla y filtros aplicados
      final rows = _buildFilteredRows(ref.read);
      final columns = ['id', 'sensor', 'valor', 'estado', 'fecha'];

      Future<void>(() async {
        try {
          final fileBase = 'mis_datos';
          if (action == 'csv') {
            await ExportService.exportCsvTable(
              fileName: fileBase,
              rows: rows,
              columns: columns,
            );
          } else if (action == 'csv_comma') {
            await ExportService.exportCsvTable(
              fileName: fileBase,
              rows: rows,
              columns: columns,
              useCommaDecimal: true,
            );
          } else if (action == 'json') {
            await ExportService.exportJsonTable(fileName: fileBase, rows: rows);
          } else if (action == 'excel') {
            await ExportService.exportExcelTable(
              fileName: fileBase,
              rows: rows,
              columns: columns,
            );
          } else if (action == 'pdf') {
            await ExportService.exportPdfTable(
              fileName: 'mis_datos',
              title: 'Mis datos (tabla filtrada)',
              rows: rows,
              columns: columns,
            );
          }
        } finally {
          if (mounted) {
            Navigator.of(context, rootNavigator: true).pop();
          }
        }
      });
    });
  }

  // Construye las filas actuales de la tabla con filtros aplicados
  List<Map<String, dynamic>> _buildFilteredRows(WidgetRefRead read) {
    final readings = read(
      myReadingsProvider(1000),
    ).maybeWhen(data: (r) => r, orElse: () => null);
    if (readings == null) return [];

    final List<Map<String, dynamic>> all = [];
    for (final r in readings.mq135) {
      all.add({
        'id': r.id,
        'sensor': 'MQ-135',
        'valor': r.valor,
        'estado': r.estado.name,
        'fecha': DateFormat('dd/MM/yyyy HH:mm').format(r.creadoEn),
      });
    }
    for (final r in readings.mq4) {
      all.add({
        'id': r.id,
        'sensor': 'MQ-4',
        'valor': r.valor,
        'estado': r.estado.name,
        'fecha': DateFormat('dd/MM/yyyy HH:mm').format(r.creadoEn),
      });
    }
    for (final r in readings.mq7) {
      all.add({
        'id': r.id,
        'sensor': 'MQ-7',
        'valor': r.valor,
        'estado': r.estado.name,
        'fecha': DateFormat('dd/MM/yyyy HH:mm').format(r.creadoEn),
      });
    }

    // Filtros
    final filtered = all.where((row) {
      final sensorOk =
          _appliedSensor == 'Todos' || row['sensor'] == _appliedSensor;
      final statusOk =
          _appliedStatus == 'Todos' ||
          (row['estado'] as String).toLowerCase() ==
              _appliedStatus.toLowerCase();
      bool dateOk = true;
      if (_appliedStartDate != null && (row['fecha'] as String).isNotEmpty) {
        final dt = DateFormat('dd/MM/yyyy HH:mm').parse(row['fecha'] as String);
        dateOk = dateOk && dt.isAfter(_appliedStartDate!);
      }
      if (_appliedEndDate != null && (row['fecha'] as String).isNotEmpty) {
        final dt = DateFormat('dd/MM/yyyy HH:mm').parse(row['fecha'] as String);
        dateOk =
            dateOk &&
            dt.isBefore(_appliedEndDate!.add(const Duration(days: 1)));
      }
      return sensorOk && statusOk && dateOk;
    }).toList();

    // Orden por fecha desc si aplica
    filtered.sort(
      (a, b) => (b['fecha'] as String).compareTo(a['fecha'] as String),
    );
    return filtered;
  }
}
