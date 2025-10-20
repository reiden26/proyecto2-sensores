// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lectura.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Lectura _$LecturaFromJson(Map<String, dynamic> json) => Lectura(
  id: (json['id'] as num).toInt(),
  valor: (json['valor'] as num?)?.toDouble(),
  estado: $enumDecode(_$EstadoLecturaEnumEnumMap, json['estado']),
  creadoEn: DateTime.parse(json['creado_en'] as String),
);

Map<String, dynamic> _$LecturaToJson(Lectura instance) => <String, dynamic>{
  'id': instance.id,
  'valor': instance.valor,
  'estado': _$EstadoLecturaEnumEnumMap[instance.estado]!,
  'creado_en': instance.creadoEn.toIso8601String(),
};

const _$EstadoLecturaEnumEnumMap = {
  EstadoLecturaEnum.bueno: 'bueno',
  EstadoLecturaEnum.advertencia: 'advertencia',
  EstadoLecturaEnum.malo: 'malo',
};

LecturaCreate _$LecturaCreateFromJson(Map<String, dynamic> json) =>
    LecturaCreate(
      sensorCodigo: json['sensorCodigo'] as String,
      valor: (json['valor'] as num).toDouble(),
      estado: $enumDecode(_$EstadoLecturaEnumEnumMap, json['estado']),
    );

Map<String, dynamic> _$LecturaCreateToJson(LecturaCreate instance) =>
    <String, dynamic>{
      'sensorCodigo': instance.sensorCodigo,
      'valor': instance.valor,
      'estado': _$EstadoLecturaEnumEnumMap[instance.estado]!,
    };

LecturaCreateDevice _$LecturaCreateDeviceFromJson(Map<String, dynamic> json) =>
    LecturaCreateDevice(
      lecturas: (json['lecturas'] as List<dynamic>)
          .map((e) => LecturaCreate.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$LecturaCreateDeviceToJson(
  LecturaCreateDevice instance,
) => <String, dynamic>{'lecturas': instance.lecturas};

LecturasUsuario _$LecturasUsuarioFromJson(Map<String, dynamic> json) =>
    LecturasUsuario(
      mq135: (json['mq135'] as List<dynamic>)
          .map((e) => Lectura.fromJson(e as Map<String, dynamic>))
          .toList(),
      mq4: (json['mq4'] as List<dynamic>)
          .map((e) => Lectura.fromJson(e as Map<String, dynamic>))
          .toList(),
      mq7: (json['mq7'] as List<dynamic>)
          .map((e) => Lectura.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$LecturasUsuarioToJson(LecturasUsuario instance) =>
    <String, dynamic>{
      'mq135': instance.mq135,
      'mq4': instance.mq4,
      'mq7': instance.mq7,
    };

LecturaAdmin _$LecturaAdminFromJson(Map<String, dynamic> json) => LecturaAdmin(
  id: (json['id'] as num).toInt(),
  usuarioId: (json['usuarioId'] as num).toInt(),
  usuarioNombre: json['usuarioNombre'] as String,
  valor: (json['valor'] as num?)?.toDouble(),
  estado: $enumDecode(_$EstadoLecturaEnumEnumMap, json['estado']),
  creadoEn: DateTime.parse(json['creadoEn'] as String),
  fechaLectura: json['fechaLectura'] as String,
);

Map<String, dynamic> _$LecturaAdminToJson(LecturaAdmin instance) =>
    <String, dynamic>{
      'id': instance.id,
      'usuarioId': instance.usuarioId,
      'usuarioNombre': instance.usuarioNombre,
      'valor': instance.valor,
      'estado': _$EstadoLecturaEnumEnumMap[instance.estado]!,
      'creadoEn': instance.creadoEn.toIso8601String(),
      'fechaLectura': instance.fechaLectura,
    };

LecturasAdmin _$LecturasAdminFromJson(Map<String, dynamic> json) =>
    LecturasAdmin(
      mq135: (json['mq135'] as List<dynamic>)
          .map((e) => LecturaAdmin.fromJson(e as Map<String, dynamic>))
          .toList(),
      mq4: (json['mq4'] as List<dynamic>)
          .map((e) => LecturaAdmin.fromJson(e as Map<String, dynamic>))
          .toList(),
      mq7: (json['mq7'] as List<dynamic>)
          .map((e) => LecturaAdmin.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$LecturasAdminToJson(LecturasAdmin instance) =>
    <String, dynamic>{
      'mq135': instance.mq135,
      'mq4': instance.mq4,
      'mq7': instance.mq7,
    };
