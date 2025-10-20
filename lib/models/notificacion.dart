import 'package:json_annotation/json_annotation.dart';

part 'notificacion.g.dart';

enum EstadoNotificacionEnum {
  @JsonValue('bueno')
  bueno,
  @JsonValue('advertencia')
  advertencia,
  @JsonValue('malo')
  malo,
  @JsonValue('desconectado')
  desconectado,
}

enum TipoNotificacionEnum {
  @JsonValue('info')
  info,
  @JsonValue('warning')
  warning,
  @JsonValue('danger')
  danger,
}

@JsonSerializable()
class Notificacion {
  final int id;
  final int usuarioId;
  final String sensorCodigo;
  final double valor;
  final String estado;
  final String titulo;
  final String mensaje;
  final String tipo;
  final bool leida;
  final DateTime creadoEn;
  final DateTime? leidoEn;

  Notificacion({
    required this.id,
    required this.usuarioId,
    required this.sensorCodigo,
    required this.valor,
    required this.estado,
    required this.titulo,
    required this.mensaje,
    required this.tipo,
    required this.leida,
    required this.creadoEn,
    this.leidoEn,
  });

  factory Notificacion.fromJson(Map<String, dynamic> json) => _$NotificacionFromJson(json);
  Map<String, dynamic> toJson() => _$NotificacionToJson(this);
}

@JsonSerializable()
class NotificacionCreate {
  final int usuarioId;
  final String sensorCodigo;
  final double valor;
  final EstadoNotificacionEnum estado;
  final String titulo;
  final String mensaje;
  final TipoNotificacionEnum tipo;
  final bool? leida;

  NotificacionCreate({
    required this.usuarioId,
    required this.sensorCodigo,
    required this.valor,
    required this.estado,
    required this.titulo,
    required this.mensaje,
    required this.tipo,
    this.leida,
  });

  factory NotificacionCreate.fromJson(Map<String, dynamic> json) => _$NotificacionCreateFromJson(json);
  Map<String, dynamic> toJson() => _$NotificacionCreateToJson(this);
}

@JsonSerializable()
class NotificacionUpdate {
  final int? usuarioId;
  final String? sensorCodigo;
  final double? valor;
  final EstadoNotificacionEnum? estado;
  final String? titulo;
  final String? mensaje;
  final TipoNotificacionEnum? tipo;
  final bool? leida;

  NotificacionUpdate({
    this.usuarioId,
    this.sensorCodigo,
    this.valor,
    this.estado,
    this.titulo,
    this.mensaje,
    this.tipo,
    this.leida,
  });

  factory NotificacionUpdate.fromJson(Map<String, dynamic> json) => _$NotificacionUpdateFromJson(json);
  Map<String, dynamic> toJson() => _$NotificacionUpdateToJson(this);
}

@JsonSerializable()
class ConfiguracionNotificaciones {
  final int id;
  final int usuarioId;
  final bool notifyMq135Good;
  final bool notifyMq135Warning;
  final bool notifyMq135Bad;
  final bool notifyMq7Good;
  final bool notifyMq7Warning;
  final bool notifyMq7Bad;
  final bool notifyMq4Good;
  final bool notifyMq4Warning;
  final bool notifyMq4Bad;
  final DateTime creadoEn;
  final DateTime actualizadoEn;

  ConfiguracionNotificaciones({
    required this.id,
    required this.usuarioId,
    required this.notifyMq135Good,
    required this.notifyMq135Warning,
    required this.notifyMq135Bad,
    required this.notifyMq7Good,
    required this.notifyMq7Warning,
    required this.notifyMq7Bad,
    required this.notifyMq4Good,
    required this.notifyMq4Warning,
    required this.notifyMq4Bad,
    required this.creadoEn,
    required this.actualizadoEn,
  });

  factory ConfiguracionNotificaciones.fromJson(Map<String, dynamic> json) => _$ConfiguracionNotificacionesFromJson(json);
  Map<String, dynamic> toJson() => _$ConfiguracionNotificacionesToJson(this);
}

@JsonSerializable()
class ConfiguracionNotificacionesUpdate {
  final bool? notifyMq135Good;
  final bool? notifyMq135Warning;
  final bool? notifyMq135Bad;
  final bool? notifyMq7Good;
  final bool? notifyMq7Warning;
  final bool? notifyMq7Bad;
  final bool? notifyMq4Good;
  final bool? notifyMq4Warning;
  final bool? notifyMq4Bad;

  ConfiguracionNotificacionesUpdate({
    this.notifyMq135Good,
    this.notifyMq135Warning,
    this.notifyMq135Bad,
    this.notifyMq7Good,
    this.notifyMq7Warning,
    this.notifyMq7Bad,
    this.notifyMq4Good,
    this.notifyMq4Warning,
    this.notifyMq4Bad,
  });

  factory ConfiguracionNotificacionesUpdate.fromJson(Map<String, dynamic> json) => _$ConfiguracionNotificacionesUpdateFromJson(json);
  Map<String, dynamic> toJson() => _$ConfiguracionNotificacionesUpdateToJson(this);
}


