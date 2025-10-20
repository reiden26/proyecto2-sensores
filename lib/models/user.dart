import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

enum RolEnum {
  @JsonValue('usuario')
  usuario,
  @JsonValue('admin')
  admin,
}

@JsonSerializable()
class Usuario {
  final int id;
  final String nombre;
  final String email;
  final RolEnum rol;
  final DateTime creadoEn;
  final DateTime? actualizadoEn;

  Usuario({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
    required this.creadoEn,
    this.actualizadoEn,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) => _$UsuarioFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioToJson(this);
}

@JsonSerializable()
class UsuarioCreate {
  final String nombre;
  final String email;
  final String password;

  UsuarioCreate({
    required this.nombre,
    required this.email,
    required this.password,
  });

  factory UsuarioCreate.fromJson(Map<String, dynamic> json) => _$UsuarioCreateFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioCreateToJson(this);
}

@JsonSerializable()
class UsuarioUpdate {
  final String? nombre;
  final String? email;
  final String? password;
  final String? passwordActual;
  final RolEnum? rol;

  UsuarioUpdate({
    this.nombre,
    this.email,
    this.password,
    this.passwordActual,
    this.rol,
  });

  factory UsuarioUpdate.fromJson(Map<String, dynamic> json) => _$UsuarioUpdateFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioUpdateToJson(this);
}

@JsonSerializable()
class UsuarioLogin {
  final String email;
  final String password;

  UsuarioLogin({
    required this.email,
    required this.password,
  });

  factory UsuarioLogin.fromJson(Map<String, dynamic> json) => _$UsuarioLoginFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioLoginToJson(this);
}

@JsonSerializable()
class LoginResponse {
  final String accessToken;
  final String tokenType;
  final String rol;

  LoginResponse({
    required this.accessToken,
    required this.tokenType,
    required this.rol,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) => _$LoginResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}


