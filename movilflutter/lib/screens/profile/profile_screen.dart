import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../auth/role_selection_screen.dart';
import '../../providers/theme_provider.dart';
import 'settings_screen.dart';
import 'personal_info_screen.dart';
import 'change_password_screen.dart';
import 'image_edit_modal.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final theme = Theme.of(context);
    final themeMode = ref.watch(themeModeProvider);
    final isDark =
        themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system && theme.brightness == Brightness.dark);
    final user = authState.user;
    final isAdmin = ref.watch(isAdminProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        backgroundColor: isAdmin
            ? const Color(0xFF1976D2)
            : const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
        actions: const [],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Información del usuario
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Encabezado con gradiente
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Theme.of(
                            context,
                          ).colorScheme.primary.withOpacity(0.9),
                          Theme.of(context).colorScheme.primaryContainer,
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Column(
                      children: [
                        // Avatar con anillo superpuesto al encabezado
                        Transform.translate(
                          offset: const Offset(0, -40),
                          child: GestureDetector(
                            onTap: () => _showImageEditModal(context, user),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [
                                    Theme.of(context).colorScheme.primary,
                                    Theme.of(context).colorScheme.secondary,
                                  ],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.primary.withOpacity(0.25),
                                    blurRadius: 18,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 48,
                                backgroundColor: Theme.of(
                                  context,
                                ).colorScheme.surface,
                                backgroundImage:
                                    user?.imagenUrl != null &&
                                        user!.imagenUrl!.isNotEmpty
                                    ? NetworkImage(user.imagenUrl!)
                                    : null,
                                child:
                                    user?.imagenUrl == null ||
                                        user!.imagenUrl!.isEmpty
                                    ? Text(
                                        user?.nombre
                                                .substring(0, 1)
                                                .toUpperCase() ??
                                            'U',
                                        style: TextStyle(
                                          color: Theme.of(
                                            context,
                                          ).colorScheme.primary,
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Nombre
                        Text(
                          user?.nombre ?? 'Usuario',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                        ),
                        const SizedBox(height: 6),
                        // Email
                        Text(
                          user?.email ?? '',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.7),
                              ),
                        ),
                        const SizedBox(height: 12),
                        // Badges de rol y estado
                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: user?.rol.name == 'admin'
                                    ? Colors.red.withOpacity(0.1)
                                    : Theme.of(
                                        context,
                                      ).colorScheme.secondaryContainer,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: user?.rol.name == 'admin'
                                      ? Colors.red.withOpacity(0.3)
                                      : Theme.of(context).colorScheme.secondary
                                            .withOpacity(0.35),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    user?.rol.name == 'admin'
                                        ? Icons.verified
                                        : Icons.person_outline,
                                    size: 16,
                                    color: user?.rol.name == 'admin'
                                        ? Colors.red
                                        : Theme.of(
                                            context,
                                          ).colorScheme.secondary,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    user?.rol.name == 'admin'
                                        ? 'Administrador'
                                        : 'Usuario',
                                    style: TextStyle(
                                      color: user?.rol.name == 'admin'
                                          ? Colors.red
                                          : Theme.of(
                                              context,
                                            ).colorScheme.onSecondaryContainer,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.green.withOpacity(0.25),
                                ),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.check_circle,
                                    size: 16,
                                    color: Colors.green,
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    'Activo',
                                    style: TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            // Tema (Nocturno/Día)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(isDark ? Icons.dark_mode : Icons.light_mode),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Tema: ${isDark ? 'Nocturno' : 'Día'}',
                            style: Theme.of(context).textTheme.titleMedium,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        // Restar unos píxeles por bordes/espaciados internos para evitar overflow
                        final halfWidth =
                            (constraints.maxWidth - 6) / 2; // 2 segmentos
                        return ToggleButtons(
                          isSelected: [isDark, !isDark],
                          onPressed: (index) {
                            ref
                                .read(themeModeProvider.notifier)
                                .setTheme(
                                  index == 0 ? ThemeMode.dark : ThemeMode.light,
                                );
                          },
                          constraints: BoxConstraints(
                            minWidth: halfWidth,
                            minHeight: 40,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          selectedColor: Theme.of(
                            context,
                          ).colorScheme.onPrimary,
                          color: Theme.of(context).colorScheme.onSurface,
                          fillColor: Theme.of(
                            context,
                          ).colorScheme.primaryContainer,
                          children: const [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.dark_mode, size: 18),
                                SizedBox(width: 8),
                                Text('Nocturno'),
                              ],
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.light_mode, size: 18),
                                SizedBox(width: 8),
                                Text('Día'),
                              ],
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Opciones del perfil
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(
                      Icons.settings_outlined,
                      color: isAdmin
                          ? const Color(0xFF1976D2)
                          : const Color(0xFF2E7D32),
                    ),
                    title: const Text('Configuración'),
                    subtitle: const Text('Sesión y notificaciones'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const SettingsScreen(),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(
                      Icons.person_outline,
                      color: isAdmin
                          ? const Color(0xFF1976D2)
                          : const Color(0xFF2E7D32),
                    ),
                    title: const Text('Información personal'),
                    subtitle: const Text('Editar nombre y email'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const PersonalInfoScreen(),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(
                      Icons.lock_outline,
                      color: isAdmin
                          ? const Color(0xFF1976D2)
                          : const Color(0xFF2E7D32),
                    ),
                    title: const Text('Cambiar contraseña'),
                    subtitle: const Text('Actualizar tu contraseña'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const ChangePasswordScreen(),
                        ),
                      );
                    },
                  ),
                  // Eliminado: la configuración de notificaciones vive dentro de "Configuración"
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Información de la aplicación
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.info_outline),
                    title: const Text('Acerca de'),
                    subtitle: const Text('Información de la aplicación'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      showAboutDialog(
                        context: context,
                        applicationName: 'Sensor Monitor',
                        applicationVersion: '1.0.0',
                        applicationIcon: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            Icons.sensors,
                            color: Theme.of(context).colorScheme.onPrimary,
                            size: 32,
                          ),
                        ),
                        children: [
                          const Text(
                            'Aplicación móvil para el monitoreo de sensores MQ-135, MQ-4 y MQ-7 en tiempo real.',
                          ),
                        ],
                      );
                    },
                  ),
                  // Eliminado: Ayuda y soporte
                ],
              ),
            ),

            const SizedBox(height: 24),
            // Botón Cerrar sesión al final
            Align(
              alignment: Alignment.center,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.error,
                  foregroundColor: Theme.of(context).colorScheme.onError,
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Cerrar sesión'),
                      content: const Text(
                        '¿Estás seguro de que quieres cerrar sesión?',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: const Text('Cancelar'),
                        ),
                        FilledButton(
                          onPressed: () => Navigator.of(context).pop(true),
                          style: FilledButton.styleFrom(
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.error,
                            foregroundColor: Theme.of(
                              context,
                            ).colorScheme.onError,
                          ),
                          child: const Text('Cerrar sesión'),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true) {
                    await ref.read(authStateProvider.notifier).logout();
                    if (context.mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(
                          builder: (context) => const RoleSelectionScreen(),
                        ),
                        (route) => false,
                      );
                    }
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar sesión'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImageEditModal(BuildContext context, user) {
    showDialog(
      context: context,
      builder: (context) => ImageEditModal(
        currentImageUrl: user?.imagenUrl,
        userId: user?.id ?? 0,
      ),
    );
  }
}
