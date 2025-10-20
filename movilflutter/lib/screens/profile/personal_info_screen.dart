import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../services/user_service.dart';
import '../../widgets/action_button.dart';

class PersonalInfoScreen extends ConsumerStatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  ConsumerState<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends ConsumerState<PersonalInfoScreen> {
  final _nameController = TextEditingController();
  bool _saving = false;
  bool _editing = false;
  String? _nameError;
  final _userService = UserService();

  @override
  void initState() {
    super.initState();
    final user = ref.read(authStateProvider).user;
    if (user != null) {
      _nameController.text = user.nombre;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;
    final isAdmin = ref.watch(isAdminProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Información personal'),
        backgroundColor: isAdmin
            ? const Color(0xFF1976D2)
            : const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Tarjeta de identidad
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Nombre',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _nameController,
                          readOnly: !_editing,
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                color: _editing
                                    ? Theme.of(context).colorScheme.onSurface
                                    : Theme.of(
                                        context,
                                      ).colorScheme.onSurface.withOpacity(0.6),
                              ),
                          onChanged: (_) {
                            if (_nameError != null)
                              setState(() => _nameError = null);
                          },
                          decoration: InputDecoration(
                            hintText: 'Tu nombre',
                            hintStyle: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withOpacity(0.5),
                              fontSize: 16,
                            ),
                            errorText: _nameError,
                            prefixIcon: Icon(
                              Icons.person_outline,
                              color: isAdmin
                                  ? const Color(0xFF1976D2)
                                  : const Color(0xFF2E7D32),
                            ),
                            suffixIcon: IconButton(
                              tooltip: _editing ? 'Cancelar edición' : 'Editar',
                              icon: Icon(
                                _editing ? Icons.close : Icons.edit_outlined,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.6),
                              ),
                              onPressed: _saving
                                  ? null
                                  : () {
                                      setState(() {
                                        _editing = !_editing;
                                        if (!_editing) {
                                          // cancelar edición: restaurar nombre actual
                                          final current =
                                              ref
                                                  .read(authStateProvider)
                                                  .user
                                                  ?.nombre ??
                                              '';
                                          _nameController.text = current;
                                          _nameError = null;
                                        }
                                      });
                                    },
                            ),
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(
                                color: _editing
                                    ? Theme.of(
                                        context,
                                      ).colorScheme.outline.withOpacity(0.3)
                                    : Theme.of(
                                        context,
                                      ).colorScheme.outline.withOpacity(0.1),
                                width: _editing ? 1.5 : 1.0,
                              ),
                            ),
                            focusedBorder: UnderlineInputBorder(
                              borderSide: BorderSide(
                                color: Theme.of(context).colorScheme.primary,
                                width: 2,
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 16,
                              horizontal: 0,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Flexible(
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.outline.withOpacity(0.3),
                                    width: 1.5,
                                  ),
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(12),
                                    onTap: _editing && !_saving
                                        ? () {
                                            // cancelar
                                            setState(() {
                                              _editing = false;
                                              _nameError = null;
                                              final current =
                                                  ref
                                                      .read(authStateProvider)
                                                      .user
                                                      ?.nombre ??
                                                  '';
                                              _nameController.text = current;
                                            });
                                          }
                                        : null,
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 16,
                                        horizontal: 12,
                                      ),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.undo,
                                            color: Theme.of(context)
                                                .colorScheme
                                                .onSurface
                                                .withOpacity(0.7),
                                            size: 20,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Cancelar',
                                            style: TextStyle(
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onSurface
                                                  .withOpacity(0.7),
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Flexible(
                              child: ActionButton(
                                label: 'Guardar',
                                icon: Icons.save,
                                type: isAdmin
                                    ? ActionButtonType.primary
                                    : ActionButtonType.success,
                                isLoading: _saving,
                                onPressed: !_editing || _saving || user == null
                                    ? null
                                    : () async {
                                        final newName = _nameController.text
                                            .trim();
                                        if (newName.isEmpty) {
                                          setState(
                                            () => _nameError =
                                                'El nombre no puede estar vacío',
                                          );
                                          return;
                                        }
                                        if (newName.length < 2) {
                                          setState(
                                            () => _nameError =
                                                'Mínimo 2 caracteres',
                                          );
                                          return;
                                        }
                                        setState(() => _saving = true);
                                        try {
                                          await _userService.updateUserProfile(
                                            user.id,
                                            nombre: newName,
                                          );
                                          final updated = user.copyWith(
                                            nombre: newName,
                                          );
                                          ref
                                              .read(authStateProvider.notifier)
                                              .updateUser(updated);
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                  'Nombre actualizado',
                                                ),
                                              ),
                                            );
                                          }
                                          if (mounted)
                                            setState(() {
                                              _editing = false;
                                            });
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              SnackBar(
                                                content: Text('Error: $e'),
                                              ),
                                            );
                                          }
                                        } finally {
                                          if (mounted)
                                            setState(() => _saving = false);
                                        }
                                      },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
