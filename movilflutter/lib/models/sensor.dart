import 'package:json_annotation/json_annotation.dart';

part 'sensor.g.dart';

@JsonSerializable()
class Sensor {
  final int id;
  final String codigo;
  final String nombre;
  final String? descripcion;

  Sensor({
    required this.id,
    required this.codigo,
    required this.nombre,
    this.descripcion,
  });

  factory Sensor.fromJson(Map<String, dynamic> json) => _$SensorFromJson(json);
  Map<String, dynamic> toJson() => _$SensorToJson(this);
}

@JsonSerializable()
class UsuarioSensor {
  final int id;
  final int usuarioId;
  final int sensorId;
  final DateTime asignadoEn;

  UsuarioSensor({
    required this.id,
    required this.usuarioId,
    required this.sensorId,
    required this.asignadoEn,
  });

  factory UsuarioSensor.fromJson(Map<String, dynamic> json) => _$UsuarioSensorFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioSensorToJson(this);
}

@JsonSerializable()
class UsuarioSensorUpdate {
  final List<int> asignados;

  UsuarioSensorUpdate({
    required this.asignados,
  });

  factory UsuarioSensorUpdate.fromJson(Map<String, dynamic> json) => _$UsuarioSensorUpdateFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioSensorUpdateToJson(this);
}

@JsonSerializable()
class SensoresActivos {
  final int id;
  final int usuarioId;
  final bool mq135Activo;
  final bool mq4Activo;
  final bool mq7Activo;
  final DateTime actualizadoEn;

  SensoresActivos({
    required this.id,
    required this.usuarioId,
    required this.mq135Activo,
    required this.mq4Activo,
    required this.mq7Activo,
    required this.actualizadoEn,
  });

  factory SensoresActivos.fromJson(Map<String, dynamic> json) => _$SensoresActivosFromJson(json);
  Map<String, dynamic> toJson() => _$SensoresActivosToJson(this);
}
