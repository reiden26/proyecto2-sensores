import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import '../auth/role_selection_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../onboarding/onboarding_screen.dart';
import '../onboarding/onboarding_screen.dart' show OnboardingScreenStateFlag;

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final List<_Particle> _particles;
  late final Ticker _ticker;
  static const int _numParticles = 100;
  static const Duration _duration = Duration(milliseconds: 16000);
  double _time = 0.0; // fase global para animaciones (gauge y color)
  bool _navigating = false;

  @override
  void initState() {
    super.initState();

    // Semilla para trayectorias aleatorias
    final random = Random();
    _particles = List.generate(_numParticles, (_) => _Particle.random(random));

    // Ticker manual para animación continua (guardamos referencia para disponerla)
    _ticker = createTicker((elapsed) {
      if (!mounted) return;
      final t =
          (elapsed.inMilliseconds % _duration.inMilliseconds) /
          _duration.inMilliseconds;
      _updateParticles(t);
      _time += 0.02; // avanza fase global
      setState(() {});
    })..start();

    // Navegar después de 6.5s: si no vio onboarding -> Onboarding; si ya lo vio -> Selección de Rol
    Future.delayed(const Duration(milliseconds: 6500), () async {
      if (!mounted || _navigating) return;
      _navigating = true;
      _ticker.stop();
      final prefs = await SharedPreferences.getInstance();
      final seen = prefs.getBool(OnboardingScreenStateFlag.flagKey) ?? false;
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) =>
              seen ? const RoleSelectionScreen() : const OnboardingScreen(),
        ),
      );
    });
  }

  void _updateParticles(double t) {
    for (final p in _particles) {
      p.update(t);
    }
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
      body: CustomPaint(
        painter: _ParticlesPainter(_particles, isDark: isDark),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // AQI Gauge animado
              SizedBox(
                width: 120,
                height: 120,
                child: CustomPaint(
                  painter: _AQIGaugePainter(
                    progress:
                        (sin(_time) + 1) / 2, // 0..1 llenándose y vaciándose
                    color: null,
                    isDark: isDark,
                  ),
                  child: Center(
                    child: Container(
                      width: 84,
                      height: 84,
                      decoration: BoxDecoration(
                        color: (isDark ? Colors.white : Colors.black)
                            .withOpacity(0.08),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.air,
                        color: isDark ? Colors.white : Colors.black87,
                        size: 40,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Proyecto II',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Particle {
  _Particle(
    this.originX,
    this.originY,
    this.radius,
    this.speed,
    this.phase,
    this.huePhase,
  );

  // Posición base y propiedades
  double originX;
  double originY;
  double radius;
  double speed; // velocidad vertical
  double phase; // desfase para oscilación horizontal
  double huePhase; // desfase para ciclo de color

  // Construcción aleatoria
  factory _Particle.random(Random rng) {
    return _Particle(
      rng.nextDouble(), // originX normalizado [0,1]
      rng.nextDouble(), // originY normalizado [0,1]
      rng.nextDouble() * 4.5 + 2.0, // radio MÁS GRANDE 2..6.5
      rng.nextDouble() * 0.35 + 0.12, // velocidad MÁS RÁPIDA
      rng.nextDouble() * 2 * pi, // fase
      rng.nextDouble() * 2 * pi, // huePhase
    );
  }

  void update(double t) {
    // Movimiento vertical hacia arriba y wrap al llegar arriba
    originY -= speed * 0.015; // incremento mayor para más velocidad
    if (originY < -0.1) originY = 1.1;
    // ligera deriva horizontal sinusoidal
    phase += 0.02; // un poco más rápida
    huePhase += 0.02;
  }
}

class _ParticlesPainter extends CustomPainter {
  _ParticlesPainter(this.particles, {required this.isDark});

  final List<_Particle> particles;
  final bool isDark;
  final Paint _paint = Paint()..style = PaintingStyle.fill;

  // Colores clave
  static const Color _green = Color(0xFF4CAF50);
  static const Color _yellow = Color(0xFFFFEB3B);
  static const Color _red = Color(0xFFF44336);

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;
    final double w = size.width;
    final double h = size.height;

    for (final p in particles) {
      // Posición actual: oscilación horizontal basada en fase
      final x = p.originX * w + sin(p.phase) * 18; // mayor amplitud
      final y = p.originY * h;

      // Interpolación cíclica de color: red -> yellow -> green -> red
      final double cycle = (sin(p.huePhase) + 1) / 2; // 0..1
      Color color;
      if (cycle < 0.5) {
        final t = cycle / 0.5;
        color = Color.lerp(_red, _yellow, t)!;
      } else {
        final t = (cycle - 0.5) / 0.5;
        color = Color.lerp(_yellow, _green, t)!;
      }

      final pr = p.radius.isFinite && p.radius > 0 ? p.radius : 2.0;
      _paint.color = color.withOpacity(isDark ? 0.7 : 0.6);
      canvas.drawCircle(Offset(x, y), pr, _paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlesPainter oldDelegate) => true;
}

// Pinta el medidor circular con efecto de barrido
class _AQIGaugePainter extends CustomPainter {
  _AQIGaugePainter({
    required this.progress,
    required Color? color,
    required this.isDark,
  }) : color = color;
  final double progress; // 0..1
  final Color? color; // si es null, calculamos según progreso
  final bool isDark;

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = max(0.0, min(size.width, size.height) / 2);

    final backgroundPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..color = (isDark ? Colors.white : Colors.black).withOpacity(0.12);
    canvas.drawCircle(center, radius - 6, backgroundPaint);

    final sweepPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 12
      ..color = (color ?? _colorFromProgress(progress));

    final startAngle = -pi / 2;
    final sweepAngle = 2 * pi * progress;
    final rect = Rect.fromCircle(center: center, radius: radius - 6);
    canvas.drawArc(rect, startAngle, sweepAngle, false, sweepPaint);
  }

  @override
  bool shouldRepaint(covariant _AQIGaugePainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.isDark != isDark;
  }
}

// Color por progreso (bajo=rojo, medio=amarillo, alto=verde)
Color _colorFromProgress(double progress) {
  const green = Color(0xFF4CAF50);
  const yellow = Color(0xFFFFEB3B);
  const red = Color(0xFFF44336);
  final p = progress.clamp(0.0, 1.0);
  if (p < 0.5) {
    final t = p / 0.5; // rojo -> amarillo
    return Color.lerp(red, yellow, t)!;
  } else {
    final t = (p - 0.5) / 0.5; // amarillo -> verde
    return Color.lerp(yellow, green, t)!;
  }
}
