import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../services/report_service.dart';
import '../../models/reporte.dart';
// import '../../models/lectura.dart';
import 'admin_user_management_screen.dart';
import '../profile/admin_profile_screen.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Refrescar datos al cargar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(sensorCaptureStateProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    // final authState = ref.watch(authStateProvider);
    final isAdmin = ref.watch(isAdminProvider);
    final sensorState = ref.watch(sensorCaptureStateProvider);

    if (!isAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Acceso Denegado')),
        body: const Center(
          child: Text('No tienes permisos para acceder a esta sección'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Panel de Administración'),
        backgroundColor: const Color(0xFF1976D2),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const AdminProfileScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Estado de Sensores
            Text(
              'Estado de Sensores',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1976D2),
              ),
            ),
            const SizedBox(height: 12),

            if (sensorState.isLoading)
              const Center(child: CircularProgressIndicator())
            else
              Column(
                children: [
                  _buildSensorStatusCard(
                    'MQ-135',
                    'Calidad del Aire',
                    'mq135',
                    sensorState,
                  ),
                  const SizedBox(height: 12),
                  _buildSensorStatusCard(
                    'MQ-4',
                    'Gas Metano',
                    'mq4',
                    sensorState,
                  ),
                  const SizedBox(height: 12),
                  _buildSensorStatusCard(
                    'MQ-7',
                    'Monóxido de Carbono',
                    'mq7',
                    sensorState,
                  ),
                ],
              ),

            const SizedBox(height: 24),

            // Estadísticas del dashboard
            Text(
              'Estadísticas Generales',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1976D2),
              ),
            ),
            const SizedBox(height: 12),

            FutureBuilder<DashboardStats>(
              future: ReportService().getDashboardStats(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'Error al cargar estadísticas: ${snapshot.error}',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  );
                }

                final stats = snapshot.data!;
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Usuarios',
                            stats.totalUsers.toString(),
                            Icons.people,
                            const Color(0xFF1976D2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'Sensores',
                            stats.totalSensors.toString(),
                            Icons.sensors,
                            const Color(0xFF388E3C),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Datos',
                            stats.totalDataPoints.toString(),
                            Icons.analytics,
                            const Color(0xFFF57C00),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'Alertas',
                            stats.activeNotifications.toString(),
                            Icons.warning,
                            const Color(0xFFD32F2F),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 24),

            // Acciones rápidas
            Text(
              'Acciones Rápidas',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1976D2),
              ),
            ),
            const SizedBox(height: 12),

            Card(
              elevation: 4,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(
                      Icons.people_outline,
                      color: Color(0xFF1976D2),
                    ),
                    title: const Text('Gestionar Usuarios'),
                    subtitle: const Text(
                      'Ver, crear, editar usuarios y asignar sensores',
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) =>
                              const AdminUserManagementScreen(),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.analytics_outlined,
                      color: Color(0xFF1976D2),
                    ),
                    title: const Text('Ver Reportes'),
                    subtitle: const Text('Análisis y estadísticas detalladas'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Función en desarrollo')),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorStatusCard(
    String name,
    String description,
    String sensorCode,
    dynamic sensorState,
  ) {
    final isActive = sensorState.sensorStates[sensorCode] ?? false;
    final isConnected = sensorState.connectionStates[sensorCode] ?? false;

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 12,
              height: 60,
              decoration: BoxDecoration(
                color: isActive
                    ? (isConnected ? Colors.green : Colors.orange)
                    : Colors.grey,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1976D2),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? (isConnected
                                    ? Colors.green.withOpacity(0.1)
                                    : Colors.orange.withOpacity(0.1))
                              : Colors.grey.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          isActive
                              ? (isConnected ? 'Activo' : 'Conectando...')
                              : 'Inactivo',
                          style: TextStyle(
                            color: isActive
                                ? (isConnected ? Colors.green : Colors.orange)
                                : Colors.grey,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Icon(
              isActive ? Icons.sensors : Icons.sensors_off,
              color: isActive
                  ? (isConnected ? Colors.green : Colors.orange)
                  : Colors.grey,
              size: 32,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // String _formatDateTime(DateTime dateTime) {
  //   final now = DateTime.now();
  //   final difference = now.difference(dateTime);
  //   if (difference.inMinutes < 1) return 'Ahora';
  //   if (difference.inMinutes < 60) return '${difference.inMinutes}m';
  //   if (difference.inHours < 24) return '${difference.inHours}h';
  //   return '${difference.inDays}d';
  // }
}
