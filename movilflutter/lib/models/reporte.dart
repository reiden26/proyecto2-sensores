import 'package:json_annotation/json_annotation.dart';

part 'reporte.g.dart';

@JsonSerializable()
class DashboardStats {
  final int totalUsers;
  final int totalSensors;
  final int totalDataPoints;
  final int activeNotifications;

  DashboardStats({
    required this.totalUsers,
    required this.totalSensors,
    required this.totalDataPoints,
    required this.activeNotifications,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalUsers: (json['totalUsers'] ?? json['total_users'] ?? 0) as int,
      totalSensors: (json['totalSensors'] ?? json['total_sensors'] ?? 0) as int,
      totalDataPoints:
          (json['totalDataPoints'] ?? json['total_data_points'] ?? 0) as int,
      activeNotifications:
          (json['activeNotifications'] ?? json['active_notifications'] ?? 0)
              as int,
    );
  }

  Map<String, dynamic> toJson() => _$DashboardStatsToJson(this);
}

@JsonSerializable()
class AnaliticaTemporal {
  final String label;
  final String desde;
  final String hasta;
  final TotalesAnalitica totales;

  AnaliticaTemporal({
    required this.label,
    required this.desde,
    required this.hasta,
    required this.totales,
  });

  factory AnaliticaTemporal.fromJson(Map<String, dynamic> json) =>
      _$AnaliticaTemporalFromJson(json);
  Map<String, dynamic> toJson() => _$AnaliticaTemporalToJson(this);
}

@JsonSerializable()
class TotalesAnalitica {
  final int mq135;
  final int mq4;
  final int mq7;
  final int total;

  TotalesAnalitica({
    required this.mq135,
    required this.mq4,
    required this.mq7,
    required this.total,
  });

  factory TotalesAnalitica.fromJson(Map<String, dynamic> json) =>
      _$TotalesAnaliticaFromJson(json);
  Map<String, dynamic> toJson() => _$TotalesAnaliticaToJson(this);
}

@JsonSerializable()
class Alerta {
  final String id;
  final String sensor;
  final String sensorNombre;
  final String mensaje;
  final String severidad;
  final double valor;
  final String? usuario;
  final String? usuarioNombre;
  final String? correo;
  final String? email;
  final String timestamp;
  final String creadoEn;
  final bool resuelto;

  Alerta({
    required this.id,
    required this.sensor,
    required this.sensorNombre,
    required this.mensaje,
    required this.severidad,
    required this.valor,
    this.usuario,
    this.usuarioNombre,
    this.correo,
    this.email,
    required this.timestamp,
    required this.creadoEn,
    required this.resuelto,
  });

  factory Alerta.fromJson(Map<String, dynamic> json) => _$AlertaFromJson(json);
  Map<String, dynamic> toJson() => _$AlertaToJson(this);
}

@JsonSerializable()
class AlertasReporte {
  final List<Alerta> alertas;

  AlertasReporte({required this.alertas});

  factory AlertasReporte.fromJson(Map<String, dynamic> json) =>
      _$AlertasReporteFromJson(json);
  Map<String, dynamic> toJson() => _$AlertasReporteToJson(this);
}

@JsonSerializable()
class UsuarioActividad {
  final int id;
  final String nombre;
  final String email;
  final String rol;
  final int sensoresAsignados;
  final bool estaConectado;
  final String? ultimaConexion;
  final int duracionUltimaSesion;
  final int totalLecturas;

  UsuarioActividad({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
    required this.sensoresAsignados,
    required this.estaConectado,
    this.ultimaConexion,
    required this.duracionUltimaSesion,
    required this.totalLecturas,
  });

  factory UsuarioActividad.fromJson(Map<String, dynamic> json) =>
      _$UsuarioActividadFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioActividadToJson(this);
}

@JsonSerializable()
class EstadisticasUsuarios {
  final int totalUsuarios;
  final int adminUsuarios;
  final int usuariosRegulares;

  EstadisticasUsuarios({
    required this.totalUsuarios,
    required this.adminUsuarios,
    required this.usuariosRegulares,
  });

  factory EstadisticasUsuarios.fromJson(Map<String, dynamic> json) =>
      _$EstadisticasUsuariosFromJson(json);
  Map<String, dynamic> toJson() => _$EstadisticasUsuariosToJson(this);
}

@JsonSerializable()
class UsuariosReporte {
  final EstadisticasUsuarios estadisticas;
  final List<UsuarioActividad> actividadUsuarios;

  UsuariosReporte({
    required this.estadisticas,
    required this.actividadUsuarios,
  });

  factory UsuariosReporte.fromJson(Map<String, dynamic> json) =>
      _$UsuariosReporteFromJson(json);
  Map<String, dynamic> toJson() => _$UsuariosReporteToJson(this);
}

@JsonSerializable()
class SensorEstado {
  final int id;
  final String codigo;
  final String nombre;
  final String descripcion;
  final String estado;
  final double valorActual;
  final String unidad;
  final String? ultimaActualizacion;

  SensorEstado({
    required this.id,
    required this.codigo,
    required this.nombre,
    required this.descripcion,
    required this.estado,
    required this.valorActual,
    required this.unidad,
    this.ultimaActualizacion,
  });

  factory SensorEstado.fromJson(Map<String, dynamic> json) =>
      _$SensorEstadoFromJson(json);
  Map<String, dynamic> toJson() => _$SensorEstadoToJson(this);
}

@JsonSerializable()
class SensoresReporte {
  final List<SensorEstado> sensores;

  SensoresReporte({required this.sensores});

  factory SensoresReporte.fromJson(Map<String, dynamic> json) =>
      _$SensoresReporteFromJson(json);
  Map<String, dynamic> toJson() => _$SensoresReporteToJson(this);
}
