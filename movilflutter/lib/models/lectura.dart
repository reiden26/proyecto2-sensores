import 'package:json_annotation/json_annotation.dart';

part 'lectura.g.dart';

enum EstadoLecturaEnum {
  @JsonValue('bueno')
  bueno,
  @JsonValue('advertencia')
  advertencia,
  @JsonValue('malo')
  malo,
}

@JsonSerializable()
class Lectura {
  final int id;
  final double? valor;
  final EstadoLecturaEnum estado;
  @JsonKey(name: 'creado_en')
  final DateTime creadoEn;

  Lectura({
    required this.id,
    required this.valor,
    required this.estado,
    required this.creadoEn,
  });

  factory Lectura.fromJson(Map<String, dynamic> json) =>
      _$LecturaFromJson(json);
  Map<String, dynamic> toJson() => _$LecturaToJson(this);
}

@JsonSerializable()
class LecturaCreate {
  final String sensorCodigo;
  final double valor;
  final EstadoLecturaEnum estado;

  LecturaCreate({
    required this.sensorCodigo,
    required this.valor,
    required this.estado,
  });

  factory LecturaCreate.fromJson(Map<String, dynamic> json) =>
      _$LecturaCreateFromJson(json);
  Map<String, dynamic> toJson() => _$LecturaCreateToJson(this);
}

@JsonSerializable()
class LecturaCreateDevice {
  final List<LecturaCreate> lecturas;

  LecturaCreateDevice({required this.lecturas});

  factory LecturaCreateDevice.fromJson(Map<String, dynamic> json) =>
      _$LecturaCreateDeviceFromJson(json);
  Map<String, dynamic> toJson() => _$LecturaCreateDeviceToJson(this);
}

@JsonSerializable()
class LecturasUsuario {
  final List<Lectura> mq135;
  final List<Lectura> mq4;
  final List<Lectura> mq7;

  LecturasUsuario({required this.mq135, required this.mq4, required this.mq7});

  factory LecturasUsuario.fromJson(Map<String, dynamic> json) {
    return LecturasUsuario(
      mq135: (json['mq135'] as List<dynamic>? ?? [])
          .map((item) => Lectura.fromJson(item as Map<String, dynamic>))
          .toList(),
      mq4: (json['mq4'] as List<dynamic>? ?? [])
          .map((item) => Lectura.fromJson(item as Map<String, dynamic>))
          .toList(),
      mq7: (json['mq7'] as List<dynamic>? ?? [])
          .map((item) => Lectura.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => _$LecturasUsuarioToJson(this);
}

@JsonSerializable()
class LecturaAdmin {
  final int id;
  final int usuarioId;
  final String usuarioNombre;
  final double? valor;
  final EstadoLecturaEnum estado;
  final DateTime creadoEn;
  final String fechaLectura;

  LecturaAdmin({
    required this.id,
    required this.usuarioId,
    required this.usuarioNombre,
    this.valor,
    required this.estado,
    required this.creadoEn,
    required this.fechaLectura,
  });

  factory LecturaAdmin.fromJson(Map<String, dynamic> json) =>
      _$LecturaAdminFromJson(json);
  Map<String, dynamic> toJson() => _$LecturaAdminToJson(this);
}

@JsonSerializable()
class LecturasAdmin {
  final List<LecturaAdmin> mq135;
  final List<LecturaAdmin> mq4;
  final List<LecturaAdmin> mq7;

  LecturasAdmin({required this.mq135, required this.mq4, required this.mq7});

  factory LecturasAdmin.fromJson(Map<String, dynamic> json) =>
      _$LecturasAdminFromJson(json);
  Map<String, dynamic> toJson() => _$LecturasAdminToJson(this);
}
