// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sensor.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Sensor _$SensorFromJson(Map<String, dynamic> json) => Sensor(
  id: (json['id'] as num).toInt(),
  codigo: json['codigo'] as String,
  nombre: json['nombre'] as String,
  descripcion: json['descripcion'] as String?,
);

Map<String, dynamic> _$SensorToJson(Sensor instance) => <String, dynamic>{
  'id': instance.id,
  'codigo': instance.codigo,
  'nombre': instance.nombre,
  'descripcion': instance.descripcion,
};

UsuarioSensor _$UsuarioSensorFromJson(Map<String, dynamic> json) =>
    UsuarioSensor(
      id: (json['id'] as num).toInt(),
      usuarioId: (json['usuarioId'] as num).toInt(),
      sensorId: (json['sensorId'] as num).toInt(),
      asignadoEn: DateTime.parse(json['asignadoEn'] as String),
    );

Map<String, dynamic> _$UsuarioSensorToJson(UsuarioSensor instance) =>
    <String, dynamic>{
      'id': instance.id,
      'usuarioId': instance.usuarioId,
      'sensorId': instance.sensorId,
      'asignadoEn': instance.asignadoEn.toIso8601String(),
    };

UsuarioSensorUpdate _$UsuarioSensorUpdateFromJson(Map<String, dynamic> json) =>
    UsuarioSensorUpdate(
      asignados: (json['asignados'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
    );

Map<String, dynamic> _$UsuarioSensorUpdateToJson(
  UsuarioSensorUpdate instance,
) => <String, dynamic>{'asignados': instance.asignados};

SensoresActivos _$SensoresActivosFromJson(Map<String, dynamic> json) =>
    SensoresActivos(
      id: (json['id'] as num).toInt(),
      usuarioId: (json['usuarioId'] as num).toInt(),
      mq135Activo: json['mq135Activo'] as bool,
      mq4Activo: json['mq4Activo'] as bool,
      mq7Activo: json['mq7Activo'] as bool,
      actualizadoEn: DateTime.parse(json['actualizadoEn'] as String),
    );

Map<String, dynamic> _$SensoresActivosToJson(SensoresActivos instance) =>
    <String, dynamic>{
      'id': instance.id,
      'usuarioId': instance.usuarioId,
      'mq135Activo': instance.mq135Activo,
      'mq4Activo': instance.mq4Activo,
      'mq7Activo': instance.mq7Activo,
      'actualizadoEn': instance.actualizadoEn.toIso8601String(),
    };
