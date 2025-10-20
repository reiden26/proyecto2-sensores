import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../auth/role_selection_screen.dart';

class OnboardingScreenStateFlag {
  static const String flagKey = 'onboarding_seen';
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _current = 0;

  final List<_OnbPage> _pages = const [
    _OnbPage(
      icon: Icons.sensors,
      imageAsset: 'assets/images/onb_sensors.svg',
      title: 'Controla tus sensores',
      subtitle:
          'Activa o desactiva la lectura de MQ-135, MQ-4 y MQ-7 en tiempo real.',
      gradientStart: Color(0xFF5B86E5),
      gradientEnd: Color(0xFF36D1DC),
    ),
    _OnbPage(
      icon: Icons.show_chart,
      imageAsset: 'assets/images/onb_charts.svg',
      title: 'Gráficas y filtros',
      subtitle:
          'Explora métricas, aplica filtros por fecha y recibe alertas personalizadas.',
      gradientStart: Color(0xFF8E2DE2),
      gradientEnd: Color(0xFF4A00E0),
    ),
    _OnbPage(
      icon: Icons.file_download,
      imageAsset: 'assets/images/onb_export.svg',
      title: 'Notificaciones y exportación',
      subtitle:
          'Recibe notificaciones y exporta los datos cuando los necesites.',
      gradientStart: Color(0xFF00B09B),
      gradientEnd: Color(0xFF96C93D),
    ),
  ];

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(OnboardingScreenStateFlag.flagKey, true);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _current = i),
                itemBuilder: (context, index) {
                  final p = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [p.gradientStart, p.gradientEnd],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: p.gradientStart.withOpacity(0.25),
                            blurRadius: 24,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            _OnbHero(icon: p.icon, imageAsset: p.imageAsset),
                            const SizedBox(height: 32),
                            Text(
                              p.title,
                              textAlign: TextAlign.center,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              p.subtitle,
                              textAlign: TextAlign.center,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white.withOpacity(0.9),
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_pages.length, (i) {
                      final active = i == _current;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 240),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 6,
                        width: active ? 22 : 8,
                        decoration: BoxDecoration(
                          color: active
                              ? theme.colorScheme.primary
                              : theme.colorScheme.outlineVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      TextButton(
                        onPressed: _finish,
                        child: const Text('Saltar'),
                      ),
                      const Spacer(),
                      FilledButton(
                        onPressed: _current == _pages.length - 1
                            ? _finish
                            : () => _controller.nextPage(
                                duration: const Duration(milliseconds: 320),
                                curve: Curves.easeOutCubic,
                              ),
                        child: Text(
                          _current == _pages.length - 1
                              ? 'Ingresar'
                              : 'Siguiente',
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
    );
  }
}

class _OnbPage {
  const _OnbPage({
    required this.icon,
    this.imageAsset,
    required this.title,
    required this.subtitle,
    required this.gradientStart,
    required this.gradientEnd,
  });

  final IconData icon;
  final String? imageAsset;
  final String title;
  final String subtitle;
  final Color gradientStart;
  final Color gradientEnd;
}

class _OnbHero extends StatelessWidget {
  const _OnbHero({required this.icon, this.imageAsset});
  final IconData icon;
  final String? imageAsset;

  @override
  Widget build(BuildContext context) {
    // Si hay imagen y existe en assets, la mostramos; si falla, usamos el ícono.
    return SizedBox(
      width: 140,
      height: 140,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(80),
        child: Builder(
          builder: (context) {
            if (imageAsset != null) {
              if (imageAsset!.toLowerCase().endsWith('.svg')) {
                return SvgPicture.asset(
                  imageAsset!,
                  fit: BoxFit.contain,
                  placeholderBuilder: (_) => _fallback(icon),
                );
              } else {
                return Image.asset(
                  imageAsset!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _fallback(icon),
                );
              }
            }
            return _fallback(icon);
          },
        ),
      ),
    );
  }

  Widget _fallback(IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white24, width: 2),
      ),
      child: Icon(icon, size: 56, color: Colors.white),
    );
  }
}
