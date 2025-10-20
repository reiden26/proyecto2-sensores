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

@JsonSerializable(fieldRename: FieldRename.snake)
class Notificacion {
  final int id;
  @JsonKey(fromJson: _toInt)
  final int usuarioId;
  final String sensorCodigo;
  @JsonKey(fromJson: _toDouble)
  final double valor;
  final String estado;
  final String titulo;
  final String mensaje;
  final String tipo;
  @JsonKey(fromJson: _toBool)
  final bool leida;
  @JsonKey(fromJson: _parseDateTime, toJson: _dateToString)
  final DateTime creadoEn;
  @JsonKey(fromJson: _parseDateTime, toJson: _dateToString)
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

  // Parser flexible para respuestas del backend (nombres/formatos variables)
  factory Notificacion.fromFlexible(Map<String, dynamic> json) {
    return Notificacion(
      id: _toInt(json['id'] ?? json['notification_id'] ?? json['ID']),
      usuarioId: _toInt(json['usuario_id'] ?? json['user_id']),
      sensorCodigo: (json['sensor_codigo'] ?? json['sensor'] ?? '').toString(),
      valor: _toDouble(json['valor'] ?? json['value']),
      estado: (json['estado'] ?? json['status'] ?? '').toString(),
      titulo: (json['titulo'] ?? json['title'] ?? 'Notificación').toString(),
      mensaje: (json['mensaje'] ?? json['message'] ?? '').toString(),
      tipo: (json['tipo'] ?? json['type'] ?? 'info').toString(),
      leida: _toBool(json['leida'] ?? json['read']),
      creadoEn: _parseDateTime(json['creado_en'] ?? json['created_at'] ?? json['fecha'] ?? DateTime.now().toString()),
      leidoEn: _parseDateTime(json['leido_en'] ?? json['read_at']),
    );
  }
}

@JsonSerializable(fieldRename: FieldRename.snake)
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

@JsonSerializable(fieldRename: FieldRename.snake)
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

@JsonSerializable(fieldRename: FieldRename.snake)
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
  @JsonKey(fromJson: _parseDateTime, toJson: _dateToString)
  final DateTime creadoEn;
  @JsonKey(fromJson: _parseDateTime, toJson: _dateToString)
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

@JsonSerializable(fieldRename: FieldRename.snake)
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

// Helpers para parseo de fechas (acepta "YYYY-MM-DD HH:MM:SS" o ISO)
DateTime _parseDateTime(dynamic v) {
  if (v == null) return DateTime.fromMillisecondsSinceEpoch(0);
  if (v is DateTime) return v;
  if (v is int) {
    // asume epoch ms
    return DateTime.fromMillisecondsSinceEpoch(v);
  }
  final s = v.toString();
  // Reemplazar espacio por 'T' para compatibilidad con DateTime.parse
  final normalized = s.contains(' ') ? s.replaceFirst(' ', 'T') : s;
  return DateTime.tryParse(normalized) ?? DateTime.fromMillisecondsSinceEpoch(0);
}

String _dateToString(DateTime? dt) {
  if (dt == null) return '';
  return dt.toIso8601String();
}

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? 0;
}

double _toDouble(dynamic v) {
  if (v == null) return 0.0;
  if (v is double) return v;
  if (v is int) return v.toDouble();
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0.0;
}

bool _toBool(dynamic v) {
  if (v == null) return false;
  if (v is bool) return v;
  if (v is num) return v != 0;
  final s = v.toString().toLowerCase();
  return s == 'true' || s == '1' || s == 'yes';
}
