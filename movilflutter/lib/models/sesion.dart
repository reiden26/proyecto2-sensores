import 'package:json_annotation/json_annotation.dart';

part 'sesion.g.dart';

@JsonSerializable()
class SesionCaptura {
  final int id;
  final int usuarioId;
  final String sensorCodigo;
  final DateTime iniciadoEn;
  final DateTime? finalizadoEn;
  final bool activo;
  final int totalLecturas;

  SesionCaptura({
    required this.id,
    required this.usuarioId,
    required this.sensorCodigo,
    required this.iniciadoEn,
    this.finalizadoEn,
    required this.activo,
    required this.totalLecturas,
  });

  factory SesionCaptura.fromJson(Map<String, dynamic> json) => _$SesionCapturaFromJson(json);
  Map<String, dynamic> toJson() => _$SesionCapturaToJson(this);
}

@JsonSerializable()
class SesionHistorial {
  final int id;
  final String sensorCodigo;
  final DateTime iniciadoEn;
  final DateTime? finalizadoEn;
  final String? duracion;
  final int totalLecturas;
  final double? promedioValor;
  final double? maxValor;
  final double? minValor;

  SesionHistorial({
    required this.id,
    required this.sensorCodigo,
    required this.iniciadoEn,
    this.finalizadoEn,
    this.duracion,
    required this.totalLecturas,
    this.promedioValor,
    this.maxValor,
    this.minValor,
  });

  factory SesionHistorial.fromJson(Map<String, dynamic> json) => _$SesionHistorialFromJson(json);
  Map<String, dynamic> toJson() => _$SesionHistorialToJson(this);
}

@JsonSerializable()
class SesionConsolidada {
  final DateTime? iniciadoEn;
  final DateTime? finalizadoEn;
  final String duracion;
  final int totalLecturas;
  final int sensoresActivos;
  final List<SesionSensor> sensores;

  SesionConsolidada({
    this.iniciadoEn,
    this.finalizadoEn,
    required this.duracion,
    required this.totalLecturas,
    required this.sensoresActivos,
    required this.sensores,
  });

  factory SesionConsolidada.fromJson(Map<String, dynamic> json) => _$SesionConsolidadaFromJson(json);
  Map<String, dynamic> toJson() => _$SesionConsolidadaToJson(this);
}

@JsonSerializable()
class SesionSensor {
  final String sensorCodigo;
  final int totalLecturas;
  final double promedioValor;
  final double maxValor;
  final double minValor;

  SesionSensor({
    required this.sensorCodigo,
    required this.totalLecturas,
    required this.promedioValor,
    required this.maxValor,
    required this.minValor,
  });

  factory SesionSensor.fromJson(Map<String, dynamic> json) => _$SesionSensorFromJson(json);
  Map<String, dynamic> toJson() => _$SesionSensorToJson(this);
}
