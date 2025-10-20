// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sesion.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SesionCaptura _$SesionCapturaFromJson(Map<String, dynamic> json) =>
    SesionCaptura(
      id: (json['id'] as num).toInt(),
      usuarioId: (json['usuarioId'] as num).toInt(),
      sensorCodigo: json['sensorCodigo'] as String,
      iniciadoEn: DateTime.parse(json['iniciadoEn'] as String),
      finalizadoEn: json['finalizadoEn'] == null
          ? null
          : DateTime.parse(json['finalizadoEn'] as String),
      activo: json['activo'] as bool,
      totalLecturas: (json['totalLecturas'] as num).toInt(),
    );

Map<String, dynamic> _$SesionCapturaToJson(SesionCaptura instance) =>
    <String, dynamic>{
      'id': instance.id,
      'usuarioId': instance.usuarioId,
      'sensorCodigo': instance.sensorCodigo,
      'iniciadoEn': instance.iniciadoEn.toIso8601String(),
      'finalizadoEn': instance.finalizadoEn?.toIso8601String(),
      'activo': instance.activo,
      'totalLecturas': instance.totalLecturas,
    };

SesionHistorial _$SesionHistorialFromJson(Map<String, dynamic> json) =>
    SesionHistorial(
      id: (json['id'] as num).toInt(),
      sensorCodigo: json['sensorCodigo'] as String,
      iniciadoEn: DateTime.parse(json['iniciadoEn'] as String),
      finalizadoEn: json['finalizadoEn'] == null
          ? null
          : DateTime.parse(json['finalizadoEn'] as String),
      duracion: json['duracion'] as String?,
      totalLecturas: (json['totalLecturas'] as num).toInt(),
      promedioValor: (json['promedioValor'] as num?)?.toDouble(),
      maxValor: (json['maxValor'] as num?)?.toDouble(),
      minValor: (json['minValor'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$SesionHistorialToJson(SesionHistorial instance) =>
    <String, dynamic>{
      'id': instance.id,
      'sensorCodigo': instance.sensorCodigo,
      'iniciadoEn': instance.iniciadoEn.toIso8601String(),
      'finalizadoEn': instance.finalizadoEn?.toIso8601String(),
      'duracion': instance.duracion,
      'totalLecturas': instance.totalLecturas,
      'promedioValor': instance.promedioValor,
      'maxValor': instance.maxValor,
      'minValor': instance.minValor,
    };

SesionConsolidada _$SesionConsolidadaFromJson(Map<String, dynamic> json) =>
    SesionConsolidada(
      iniciadoEn: json['iniciadoEn'] == null
          ? null
          : DateTime.parse(json['iniciadoEn'] as String),
      finalizadoEn: json['finalizadoEn'] == null
          ? null
          : DateTime.parse(json['finalizadoEn'] as String),
      duracion: json['duracion'] as String,
      totalLecturas: (json['totalLecturas'] as num).toInt(),
      sensoresActivos: (json['sensoresActivos'] as num).toInt(),
      sensores: (json['sensores'] as List<dynamic>)
          .map((e) => SesionSensor.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SesionConsolidadaToJson(SesionConsolidada instance) =>
    <String, dynamic>{
      'iniciadoEn': instance.iniciadoEn?.toIso8601String(),
      'finalizadoEn': instance.finalizadoEn?.toIso8601String(),
      'duracion': instance.duracion,
      'totalLecturas': instance.totalLecturas,
      'sensoresActivos': instance.sensoresActivos,
      'sensores': instance.sensores,
    };

SesionSensor _$SesionSensorFromJson(Map<String, dynamic> json) => SesionSensor(
  sensorCodigo: json['sensorCodigo'] as String,
  totalLecturas: (json['totalLecturas'] as num).toInt(),
  promedioValor: (json['promedioValor'] as num).toDouble(),
  maxValor: (json['maxValor'] as num).toDouble(),
  minValor: (json['minValor'] as num).toDouble(),
);

Map<String, dynamic> _$SesionSensorToJson(SesionSensor instance) =>
    <String, dynamic>{
      'sensorCodigo': instance.sensorCodigo,
      'totalLecturas': instance.totalLecturas,
      'promedioValor': instance.promedioValor,
      'maxValor': instance.maxValor,
      'minValor': instance.minValor,
    };
