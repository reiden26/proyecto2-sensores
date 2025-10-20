// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reporte.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardStats _$DashboardStatsFromJson(Map<String, dynamic> json) =>
    DashboardStats(
      totalUsers: (json['totalUsers'] as num).toInt(),
      totalSensors: (json['totalSensors'] as num).toInt(),
      totalDataPoints: (json['totalDataPoints'] as num).toInt(),
      activeNotifications: (json['activeNotifications'] as num).toInt(),
    );

Map<String, dynamic> _$DashboardStatsToJson(DashboardStats instance) =>
    <String, dynamic>{
      'totalUsers': instance.totalUsers,
      'totalSensors': instance.totalSensors,
      'totalDataPoints': instance.totalDataPoints,
      'activeNotifications': instance.activeNotifications,
    };

AnaliticaTemporal _$AnaliticaTemporalFromJson(Map<String, dynamic> json) =>
    AnaliticaTemporal(
      label: json['label'] as String,
      desde: json['desde'] as String,
      hasta: json['hasta'] as String,
      totales: TotalesAnalitica.fromJson(
        json['totales'] as Map<String, dynamic>,
      ),
    );

Map<String, dynamic> _$AnaliticaTemporalToJson(AnaliticaTemporal instance) =>
    <String, dynamic>{
      'label': instance.label,
      'desde': instance.desde,
      'hasta': instance.hasta,
      'totales': instance.totales,
    };

TotalesAnalitica _$TotalesAnaliticaFromJson(Map<String, dynamic> json) =>
    TotalesAnalitica(
      mq135: (json['mq135'] as num).toInt(),
      mq4: (json['mq4'] as num).toInt(),
      mq7: (json['mq7'] as num).toInt(),
      total: (json['total'] as num).toInt(),
    );

Map<String, dynamic> _$TotalesAnaliticaToJson(TotalesAnalitica instance) =>
    <String, dynamic>{
      'mq135': instance.mq135,
      'mq4': instance.mq4,
      'mq7': instance.mq7,
      'total': instance.total,
    };

Alerta _$AlertaFromJson(Map<String, dynamic> json) => Alerta(
  id: json['id'] as String,
  sensor: json['sensor'] as String,
  sensorNombre: json['sensorNombre'] as String,
  mensaje: json['mensaje'] as String,
  severidad: json['severidad'] as String,
  valor: (json['valor'] as num).toDouble(),
  usuario: json['usuario'] as String?,
  usuarioNombre: json['usuarioNombre'] as String?,
  correo: json['correo'] as String?,
  email: json['email'] as String?,
  timestamp: json['timestamp'] as String,
  creadoEn: json['creadoEn'] as String,
  resuelto: json['resuelto'] as bool,
);

Map<String, dynamic> _$AlertaToJson(Alerta instance) => <String, dynamic>{
  'id': instance.id,
  'sensor': instance.sensor,
  'sensorNombre': instance.sensorNombre,
  'mensaje': instance.mensaje,
  'severidad': instance.severidad,
  'valor': instance.valor,
  'usuario': instance.usuario,
  'usuarioNombre': instance.usuarioNombre,
  'correo': instance.correo,
  'email': instance.email,
  'timestamp': instance.timestamp,
  'creadoEn': instance.creadoEn,
  'resuelto': instance.resuelto,
};

AlertasReporte _$AlertasReporteFromJson(Map<String, dynamic> json) =>
    AlertasReporte(
      alertas: (json['alertas'] as List<dynamic>)
          .map((e) => Alerta.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$AlertasReporteToJson(AlertasReporte instance) =>
    <String, dynamic>{'alertas': instance.alertas};

UsuarioActividad _$UsuarioActividadFromJson(Map<String, dynamic> json) =>
    UsuarioActividad(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String,
      email: json['email'] as String,
      rol: json['rol'] as String,
      sensoresAsignados: (json['sensoresAsignados'] as num).toInt(),
      estaConectado: json['estaConectado'] as bool,
      ultimaConexion: json['ultimaConexion'] as String?,
      duracionUltimaSesion: (json['duracionUltimaSesion'] as num).toInt(),
      totalLecturas: (json['totalLecturas'] as num).toInt(),
    );

Map<String, dynamic> _$UsuarioActividadToJson(UsuarioActividad instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nombre': instance.nombre,
      'email': instance.email,
      'rol': instance.rol,
      'sensoresAsignados': instance.sensoresAsignados,
      'estaConectado': instance.estaConectado,
      'ultimaConexion': instance.ultimaConexion,
      'duracionUltimaSesion': instance.duracionUltimaSesion,
      'totalLecturas': instance.totalLecturas,
    };

EstadisticasUsuarios _$EstadisticasUsuariosFromJson(
  Map<String, dynamic> json,
) => EstadisticasUsuarios(
  totalUsuarios: (json['totalUsuarios'] as num).toInt(),
  adminUsuarios: (json['adminUsuarios'] as num).toInt(),
  usuariosRegulares: (json['usuariosRegulares'] as num).toInt(),
);

Map<String, dynamic> _$EstadisticasUsuariosToJson(
  EstadisticasUsuarios instance,
) => <String, dynamic>{
  'totalUsuarios': instance.totalUsuarios,
  'adminUsuarios': instance.adminUsuarios,
  'usuariosRegulares': instance.usuariosRegulares,
};

UsuariosReporte _$UsuariosReporteFromJson(Map<String, dynamic> json) =>
    UsuariosReporte(
      estadisticas: EstadisticasUsuarios.fromJson(
        json['estadisticas'] as Map<String, dynamic>,
      ),
      actividadUsuarios: (json['actividadUsuarios'] as List<dynamic>)
          .map((e) => UsuarioActividad.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$UsuariosReporteToJson(UsuariosReporte instance) =>
    <String, dynamic>{
      'estadisticas': instance.estadisticas,
      'actividadUsuarios': instance.actividadUsuarios,
    };

SensorEstado _$SensorEstadoFromJson(Map<String, dynamic> json) => SensorEstado(
  id: (json['id'] as num).toInt(),
  codigo: json['codigo'] as String,
  nombre: json['nombre'] as String,
  descripcion: json['descripcion'] as String,
  estado: json['estado'] as String,
  valorActual: (json['valorActual'] as num).toDouble(),
  unidad: json['unidad'] as String,
  ultimaActualizacion: json['ultimaActualizacion'] as String?,
);

Map<String, dynamic> _$SensorEstadoToJson(SensorEstado instance) =>
    <String, dynamic>{
      'id': instance.id,
      'codigo': instance.codigo,
      'nombre': instance.nombre,
      'descripcion': instance.descripcion,
      'estado': instance.estado,
      'valorActual': instance.valorActual,
      'unidad': instance.unidad,
      'ultimaActualizacion': instance.ultimaActualizacion,
    };

SensoresReporte _$SensoresReporteFromJson(Map<String, dynamic> json) =>
    SensoresReporte(
      sensores: (json['sensores'] as List<dynamic>)
          .map((e) => SensorEstado.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SensoresReporteToJson(SensoresReporte instance) =>
    <String, dynamic>{'sensores': instance.sensores};
