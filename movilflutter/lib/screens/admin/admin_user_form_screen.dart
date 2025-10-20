import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/user.dart';
import '../../services/user_service.dart';
import '../../services/sensor_service.dart';
import '../../models/sensor.dart';

class AdminUserFormScreen extends ConsumerStatefulWidget {
  final Usuario? user; // null para crear, Usuario para editar
  final VoidCallback? onUserSaved;

  const AdminUserFormScreen({super.key, this.user, this.onUserSaved});

  @override
  ConsumerState<AdminUserFormScreen> createState() =>
      _AdminUserFormScreenState();
}

class _AdminUserFormScreenState extends ConsumerState<AdminUserFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombreController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  RolEnum _selectedRole = RolEnum.usuario;
  List<Sensor> _allSensors = [];
  List<int> _selectedSensorIds = [];
  bool _isLoading = false;
  bool _isPasswordVisible = false;

  @override
  void initState() {
    super.initState();
    _loadData();

    if (widget.user != null) {
      _nombreController.text = widget.user!.nombre;
      _emailController.text = widget.user!.email;
      _selectedRole = widget.user!.rol;
    }
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final sensorService = SensorService();
      final userService = UserService();

      // Cargar todos los sensores
      _allSensors = await sensorService.getSensors();

      // Si estamos editando, cargar sensores asignados
      if (widget.user != null) {
        final assignedSensors = await userService.getUserSensors(
          widget.user!.id,
        );
        _selectedSensorIds = assignedSensors
            .map((s) => s['id'] as int)
            .toList();
      }

      setState(() {});
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al cargar datos: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveUser() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final userService = UserService();

      if (widget.user == null) {
        // Crear nuevo usuario
        await userService.createUser(
          nombre: _nombreController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          rol: _selectedRole,
        );

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Usuario creado correctamente'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        // Actualizar usuario existente
        final updateData = <String, dynamic>{
          'nombre': _nombreController.text.trim(),
          'email': _emailController.text.trim(),
          'rol': _selectedRole.name,
        };

        if (_passwordController.text.isNotEmpty) {
          updateData['password'] = _passwordController.text;
        }

        await userService.updateUser(widget.user!.id, updateData);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Usuario actualizado correctamente'),
            backgroundColor: Colors.green,
          ),
        );
      }

      // Actualizar sensores asignados
      await userService.updateUserSensors(
        widget.user?.id ?? 0, // Si es nuevo usuario, necesitamos obtener el ID
        _selectedSensorIds,
      );

      widget.onUserSaved?.call();
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al guardar usuario: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.user == null ? 'Crear Usuario' : 'Editar Usuario'),
        backgroundColor: const Color(0xFF1976D2),
        foregroundColor: Colors.white,
        actions: [
          if (widget.user != null)
            IconButton(icon: const Icon(Icons.delete), onPressed: _deleteUser),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Información básica
                    Card(
                      elevation: 4,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Información Básica',
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1976D2),
                                  ),
                            ),
                            const SizedBox(height: 16),

                            // Nombre
                            TextFormField(
                              controller: _nombreController,
                              decoration: const InputDecoration(
                                labelText: 'Nombre',
                                prefixIcon: Icon(Icons.person),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'El nombre es requerido';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Email
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                prefixIcon: Icon(Icons.email),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'El email es requerido';
                                }
                                if (!value.contains('@')) {
                                  return 'Ingresa un email válido';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Contraseña
                            TextFormField(
                              controller: _passwordController,
                              obscureText: !_isPasswordVisible,
                              decoration: InputDecoration(
                                labelText: widget.user == null
                                    ? 'Contraseña'
                                    : 'Nueva Contraseña (opcional)',
                                prefixIcon: const Icon(Icons.lock),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _isPasswordVisible
                                        ? Icons.visibility_off
                                        : Icons.visibility,
                                  ),
                                  onPressed: () => setState(
                                    () => _isPasswordVisible =
                                        !_isPasswordVisible,
                                  ),
                                ),
                                border: const OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (widget.user == null &&
                                    (value == null || value.isEmpty)) {
                                  return 'La contraseña es requerida';
                                }
                                if (value != null &&
                                    value.isNotEmpty &&
                                    value.length < 6) {
                                  return 'La contraseña debe tener al menos 6 caracteres';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Rol
                            DropdownButtonFormField<RolEnum>(
                              value: _selectedRole,
                              decoration: const InputDecoration(
                                labelText: 'Rol',
                                prefixIcon: Icon(Icons.admin_panel_settings),
                                border: OutlineInputBorder(),
                              ),
                              items: RolEnum.values.map((rol) {
                                return DropdownMenuItem(
                                  value: rol,
                                  child: Text(
                                    rol == RolEnum.admin
                                        ? 'Administrador'
                                        : 'Usuario',
                                  ),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() => _selectedRole = value);
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Sensores asignados
                    Card(
                      elevation: 4,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Sensores Asignados',
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1976D2),
                                  ),
                            ),
                            const SizedBox(height: 16),

                            ..._allSensors.map((sensor) {
                              final isSelected = _selectedSensorIds.contains(
                                sensor.id,
                              );
                              return CheckboxListTile(
                                title: Text(sensor.nombre),
                                subtitle: Text(
                                  sensor.descripcion ?? 'Sin descripción',
                                ),
                                value: isSelected,
                                onChanged: (value) {
                                  setState(() {
                                    if (value == true) {
                                      _selectedSensorIds.add(sensor.id);
                                    } else {
                                      _selectedSensorIds.remove(sensor.id);
                                    }
                                  });
                                },
                                activeColor: const Color(0xFF1976D2),
                              );
                            }).toList(),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Botón guardar
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _saveUser,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1976D2),
                          foregroundColor: Colors.white,
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : Text(
                                widget.user == null
                                    ? 'Crear Usuario'
                                    : 'Actualizar Usuario',
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Future<void> _deleteUser() async {
    if (widget.user == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar Usuario'),
        content: Text(
          '¿Estás seguro de que quieres eliminar a ${widget.user!.nombre}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);

      try {
        final userService = UserService();
        await userService.deleteUser(widget.user!.id);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Usuario eliminado correctamente'),
            backgroundColor: Colors.green,
          ),
        );

        widget.onUserSaved?.call();
        Navigator.of(context).pop();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al eliminar usuario: $e'),
            backgroundColor: Colors.red,
          ),
        );
      } finally {
        setState(() => _isLoading = false);
      }
    }
  }
}
