import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/settings_provider.dart';
import '../../services/user_service.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/action_button.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _nameController = TextEditingController();
  final _currentPassController = TextEditingController();
  final _newPassController = TextEditingController();
  final _confirmPassController = TextEditingController();

  final _userService = UserService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Precargar nombre desde auth
      final user = ref.read(authStateProvider).user;
      if (user != null) _nameController.text = user.nombre;
      // Precargar configuración desde backend
      try {
        final session = await _userService.getMySessionConfig();
        ref
            .read(settingsProvider.notifier)
            .setProlongSession(session['prolongar_sesion'] == true);
      } catch (_) {}
      try {
        final cfg = await _userService.getMyNotificationConfig();
        // Mapear granular a provider
        final notifier = ref.read(settingsProvider.notifier);
        notifier.setSensorState(
          'mq135',
          'good',
          cfg['notify_mq135_good'] != false,
        );
        notifier.setSensorState(
          'mq135',
          'warning',
          cfg['notify_mq135_warning'] != false,
        );
        notifier.setSensorState(
          'mq135',
          'bad',
          cfg['notify_mq135_bad'] != false,
        );
        notifier.setSensorState('mq4', 'good', cfg['notify_mq4_good'] != false);
        notifier.setSensorState(
          'mq4',
          'warning',
          cfg['notify_mq4_warning'] != false,
        );
        notifier.setSensorState('mq4', 'bad', cfg['notify_mq4_bad'] != false);
        notifier.setSensorState('mq7', 'good', cfg['notify_mq7_good'] != false);
        notifier.setSensorState(
          'mq7',
          'warning',
          cfg['notify_mq7_warning'] != false,
        );
        notifier.setSensorState('mq7', 'bad', cfg['notify_mq7_bad'] != false);
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _currentPassController.dispose();
    _newPassController.dispose();
    _confirmPassController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsProvider);
    final isAdmin = ref.watch(isAdminProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuración'),
        backgroundColor: isAdmin
            ? const Color(0xFF1976D2)
            : const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: SwitchListTile(
              title: const Text('Prolongar sesión'),
              subtitle: const Text('Mantener la sesión activa por más tiempo'),
              value: settings.prolongSession,
              activeColor: isAdmin
                  ? const Color(0xFF1976D2)
                  : const Color(0xFF2E7D32),
              onChanged: (v) =>
                  ref.read(settingsProvider.notifier).setProlongSession(v),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Notificaciones'),
                  subtitle: const Text(
                    'Activar o desactivar todas las notificaciones',
                  ),
                  value: settings.notificationsEnabled,
                  activeColor: isAdmin
                      ? const Color(0xFF1976D2)
                      : const Color(0xFF2E7D32),
                  onChanged: (v) => ref
                      .read(settingsProvider.notifier)
                      .setNotificationsEnabled(v),
                ),
                const Divider(height: 1),
                // Granulares por sensor/estado
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Preferencias por sensor',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      _sensorRow(
                        context,
                        ref,
                        'MQ-135',
                        'mq135',
                        settings.mq135Good,
                        settings.mq135Warning,
                        settings.mq135Bad,
                        isAdmin,
                      ),
                      _sensorRow(
                        context,
                        ref,
                        'MQ-4',
                        'mq4',
                        settings.mq4Good,
                        settings.mq4Warning,
                        settings.mq4Bad,
                        isAdmin,
                      ),
                      _sensorRow(
                        context,
                        ref,
                        'MQ-7',
                        'mq7',
                        settings.mq7Good,
                        settings.mq7Warning,
                        settings.mq7Bad,
                        isAdmin,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: ActionButton(
                    label: 'Guardar preferencias',
                    icon: Icons.save,
                    type: isAdmin
                        ? ActionButtonType.primary
                        : ActionButtonType.success,
                    onPressed: () async {
                      // Cargar configuración actual del backend y enviar en formato snake_case
                      final body = {
                        'notify_mq135_good': settings.mq135Good,
                        'notify_mq135_warning': settings.mq135Warning,
                        'notify_mq135_bad': settings.mq135Bad,
                        'notify_mq7_good': settings.mq7Good,
                        'notify_mq7_warning': settings.mq7Warning,
                        'notify_mq7_bad': settings.mq7Bad,
                        'notify_mq4_good': settings.mq4Good,
                        'notify_mq4_warning': settings.mq4Warning,
                        'notify_mq4_bad': settings.mq4Bad,
                      };
                      try {
                        await _userService.updateMyNotificationConfig(body);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Preferencias guardadas'),
                            ),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error al guardar: $e')),
                          );
                        }
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          // Se eliminan formularios de nombre y contraseña: viven en Perfil
        ],
      ),
    );
  }

  Widget _sensorRow(
    BuildContext context,
    WidgetRef ref,
    String label,
    String code,
    bool good,
    bool warn,
    bool bad,
    bool isAdmin,
  ) {
    return Row(
      children: [
        SizedBox(
          width: 68,
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              FilterChip(
                label: const Text('Bueno'),
                selected: good,
                selectedColor: isAdmin ? null : Colors.green.withOpacity(0.2),
                checkmarkColor: isAdmin ? null : Colors.green.shade700,
                onSelected: (v) => ref
                    .read(settingsProvider.notifier)
                    .setSensorState(code, 'good', v),
              ),
              FilterChip(
                label: const Text('Advertencia'),
                selected: warn,
                selectedColor: isAdmin ? null : Colors.orange.withOpacity(0.2),
                checkmarkColor: isAdmin ? null : Colors.orange.shade700,
                onSelected: (v) => ref
                    .read(settingsProvider.notifier)
                    .setSensorState(code, 'warning', v),
              ),
              FilterChip(
                label: const Text('Malo'),
                selected: bad,
                selectedColor: isAdmin ? null : Colors.red.withOpacity(0.2),
                checkmarkColor: isAdmin ? null : Colors.red.shade700,
                onSelected: (v) => ref
                    .read(settingsProvider.notifier)
                    .setSensorState(code, 'bad', v),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
