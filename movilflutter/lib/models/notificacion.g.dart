// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notificacion.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Notificacion _$NotificacionFromJson(Map<String, dynamic> json) => Notificacion(
  id: (json['id'] as num).toInt(),
  usuarioId: _toInt(json['usuario_id']),
  sensorCodigo: json['sensor_codigo'] as String,
  valor: _toDouble(json['valor']),
  estado: json['estado'] as String,
  titulo: json['titulo'] as String,
  mensaje: json['mensaje'] as String,
  tipo: json['tipo'] as String,
  leida: _toBool(json['leida']),
  creadoEn: _parseDateTime(json['creado_en']),
  leidoEn: _parseDateTime(json['leido_en']),
);

Map<String, dynamic> _$NotificacionToJson(Notificacion instance) =>
    <String, dynamic>{
      'id': instance.id,
      'usuario_id': instance.usuarioId,
      'sensor_codigo': instance.sensorCodigo,
      'valor': instance.valor,
      'estado': instance.estado,
      'titulo': instance.titulo,
      'mensaje': instance.mensaje,
      'tipo': instance.tipo,
      'leida': instance.leida,
      'creado_en': _dateToString(instance.creadoEn),
      'leido_en': _dateToString(instance.leidoEn),
    };

NotificacionCreate _$NotificacionCreateFromJson(Map<String, dynamic> json) =>
    NotificacionCreate(
      usuarioId: (json['usuario_id'] as num).toInt(),
      sensorCodigo: json['sensor_codigo'] as String,
      valor: (json['valor'] as num).toDouble(),
      estado: $enumDecode(_$EstadoNotificacionEnumEnumMap, json['estado']),
      titulo: json['titulo'] as String,
      mensaje: json['mensaje'] as String,
      tipo: $enumDecode(_$TipoNotificacionEnumEnumMap, json['tipo']),
      leida: json['leida'] as bool?,
    );

Map<String, dynamic> _$NotificacionCreateToJson(NotificacionCreate instance) =>
    <String, dynamic>{
      'usuario_id': instance.usuarioId,
      'sensor_codigo': instance.sensorCodigo,
      'valor': instance.valor,
      'estado': _$EstadoNotificacionEnumEnumMap[instance.estado]!,
      'titulo': instance.titulo,
      'mensaje': instance.mensaje,
      'tipo': _$TipoNotificacionEnumEnumMap[instance.tipo]!,
      'leida': instance.leida,
    };

const _$EstadoNotificacionEnumEnumMap = {
  EstadoNotificacionEnum.bueno: 'bueno',
  EstadoNotificacionEnum.advertencia: 'advertencia',
  EstadoNotificacionEnum.malo: 'malo',
  EstadoNotificacionEnum.desconectado: 'desconectado',
};

const _$TipoNotificacionEnumEnumMap = {
  TipoNotificacionEnum.info: 'info',
  TipoNotificacionEnum.warning: 'warning',
  TipoNotificacionEnum.danger: 'danger',
};

NotificacionUpdate _$NotificacionUpdateFromJson(Map<String, dynamic> json) =>
    NotificacionUpdate(
      usuarioId: (json['usuario_id'] as num?)?.toInt(),
      sensorCodigo: json['sensor_codigo'] as String?,
      valor: (json['valor'] as num?)?.toDouble(),
      estado: $enumDecodeNullable(
        _$EstadoNotificacionEnumEnumMap,
        json['estado'],
      ),
      titulo: json['titulo'] as String?,
      mensaje: json['mensaje'] as String?,
      tipo: $enumDecodeNullable(_$TipoNotificacionEnumEnumMap, json['tipo']),
      leida: json['leida'] as bool?,
    );

Map<String, dynamic> _$NotificacionUpdateToJson(NotificacionUpdate instance) =>
    <String, dynamic>{
      'usuario_id': instance.usuarioId,
      'sensor_codigo': instance.sensorCodigo,
      'valor': instance.valor,
      'estado': _$EstadoNotificacionEnumEnumMap[instance.estado],
      'titulo': instance.titulo,
      'mensaje': instance.mensaje,
      'tipo': _$TipoNotificacionEnumEnumMap[instance.tipo],
      'leida': instance.leida,
    };

ConfiguracionNotificaciones _$ConfiguracionNotificacionesFromJson(
  Map<String, dynamic> json,
) => ConfiguracionNotificaciones(
  id: (json['id'] as num).toInt(),
  usuarioId: (json['usuario_id'] as num).toInt(),
  notifyMq135Good: json['notify_mq135_good'] as bool,
  notifyMq135Warning: json['notify_mq135_warning'] as bool,
  notifyMq135Bad: json['notify_mq135_bad'] as bool,
  notifyMq7Good: json['notify_mq7_good'] as bool,
  notifyMq7Warning: json['notify_mq7_warning'] as bool,
  notifyMq7Bad: json['notify_mq7_bad'] as bool,
  notifyMq4Good: json['notify_mq4_good'] as bool,
  notifyMq4Warning: json['notify_mq4_warning'] as bool,
  notifyMq4Bad: json['notify_mq4_bad'] as bool,
  creadoEn: _parseDateTime(json['creado_en']),
  actualizadoEn: _parseDateTime(json['actualizado_en']),
);

Map<String, dynamic> _$ConfiguracionNotificacionesToJson(
  ConfiguracionNotificaciones instance,
) => <String, dynamic>{
  'id': instance.id,
  'usuario_id': instance.usuarioId,
  'notify_mq135_good': instance.notifyMq135Good,
  'notify_mq135_warning': instance.notifyMq135Warning,
  'notify_mq135_bad': instance.notifyMq135Bad,
  'notify_mq7_good': instance.notifyMq7Good,
  'notify_mq7_warning': instance.notifyMq7Warning,
  'notify_mq7_bad': instance.notifyMq7Bad,
  'notify_mq4_good': instance.notifyMq4Good,
  'notify_mq4_warning': instance.notifyMq4Warning,
  'notify_mq4_bad': instance.notifyMq4Bad,
  'creado_en': _dateToString(instance.creadoEn),
  'actualizado_en': _dateToString(instance.actualizadoEn),
};

ConfiguracionNotificacionesUpdate _$ConfiguracionNotificacionesUpdateFromJson(
  Map<String, dynamic> json,
) => ConfiguracionNotificacionesUpdate(
  notifyMq135Good: json['notify_mq135_good'] as bool?,
  notifyMq135Warning: json['notify_mq135_warning'] as bool?,
  notifyMq135Bad: json['notify_mq135_bad'] as bool?,
  notifyMq7Good: json['notify_mq7_good'] as bool?,
  notifyMq7Warning: json['notify_mq7_warning'] as bool?,
  notifyMq7Bad: json['notify_mq7_bad'] as bool?,
  notifyMq4Good: json['notify_mq4_good'] as bool?,
  notifyMq4Warning: json['notify_mq4_warning'] as bool?,
  notifyMq4Bad: json['notify_mq4_bad'] as bool?,
);

Map<String, dynamic> _$ConfiguracionNotificacionesUpdateToJson(
  ConfiguracionNotificacionesUpdate instance,
) => <String, dynamic>{
  'notify_mq135_good': instance.notifyMq135Good,
  'notify_mq135_warning': instance.notifyMq135Warning,
  'notify_mq135_bad': instance.notifyMq135Bad,
  'notify_mq7_good': instance.notifyMq7Good,
  'notify_mq7_warning': instance.notifyMq7Warning,
  'notify_mq7_bad': instance.notifyMq7Bad,
  'notify_mq4_good': instance.notifyMq4Good,
  'notify_mq4_warning': instance.notifyMq4Warning,
  'notify_mq4_bad': instance.notifyMq4Bad,
};
