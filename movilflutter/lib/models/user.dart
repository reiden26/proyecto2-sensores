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
  final String? imagenUrl;
  final DateTime? creadoEn;
  final DateTime? actualizadoEn;

  Usuario({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
    this.imagenUrl,
    this.creadoEn,
    this.actualizadoEn,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: (json['id'] as num?)?.toInt() ?? 0,
      nombre: json['nombre'] as String? ?? '',
      email: json['email'] as String? ?? '',
      rol: json['rol'] != null
          ? (json['rol'] == 'admin' ? RolEnum.admin : RolEnum.usuario)
          : RolEnum.usuario,
      imagenUrl: json['imagen_url'] as String?,
      creadoEn: json['creado_en'] != null
          ? DateTime.parse(json['creado_en'] as String)
          : null,
      actualizadoEn: json['actualizado_en'] != null
          ? DateTime.parse(json['actualizado_en'] as String)
          : null,
    );
  }
  Map<String, dynamic> toJson() => _$UsuarioToJson(this);

  Usuario copyWith({
    int? id,
    String? nombre,
    String? email,
    RolEnum? rol,
    String? imagenUrl,
    DateTime? creadoEn,
    DateTime? actualizadoEn,
  }) {
    return Usuario(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      email: email ?? this.email,
      rol: rol ?? this.rol,
      imagenUrl: imagenUrl ?? this.imagenUrl,
      creadoEn: creadoEn ?? this.creadoEn,
      actualizadoEn: actualizadoEn ?? this.actualizadoEn,
    );
  }
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

  factory UsuarioCreate.fromJson(Map<String, dynamic> json) =>
      _$UsuarioCreateFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioCreateToJson(this);
}

@JsonSerializable()
class UsuarioUpdate {
  final String? nombre;
  final String? email;
  final String? password;
  final String? passwordActual;
  final RolEnum? rol;
  final String? imagenUrl;

  UsuarioUpdate({
    this.nombre,
    this.email,
    this.password,
    this.passwordActual,
    this.rol,
    this.imagenUrl,
  });

  factory UsuarioUpdate.fromJson(Map<String, dynamic> json) =>
      _$UsuarioUpdateFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioUpdateToJson(this);
}

@JsonSerializable()
class UsuarioLogin {
  final String email;
  final String password;

  UsuarioLogin({required this.email, required this.password});

  factory UsuarioLogin.fromJson(Map<String, dynamic> json) =>
      _$UsuarioLoginFromJson(json);
  Map<String, dynamic> toJson() => _$UsuarioLoginToJson(this);
}

@JsonSerializable()
class LoginResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;
  @JsonKey(name: 'token_type')
  final String tokenType;
  final String rol;

  LoginResponse({
    required this.accessToken,
    required this.tokenType,
    required this.rol,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['access_token'] as String? ?? '',
      tokenType: json['token_type'] as String? ?? 'bearer',
      rol: json['rol'] as String? ?? 'usuario',
    );
  }

  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);

  // Getter para obtener el rol como enum
  RolEnum get rolEnum {
    switch (rol.toLowerCase()) {
      case 'admin':
        return RolEnum.admin;
      case 'usuario':
      default:
        return RolEnum.usuario;
    }
  }
}
