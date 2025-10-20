// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Usuario _$UsuarioFromJson(Map<String, dynamic> json) => Usuario(
  id: (json['id'] as num).toInt(),
  nombre: json['nombre'] as String,
  email: json['email'] as String,
  rol: $enumDecode(_$RolEnumEnumMap, json['rol']),
  imagenUrl: json['imagenUrl'] as String?,
  creadoEn: json['creadoEn'] == null
      ? null
      : DateTime.parse(json['creadoEn'] as String),
  actualizadoEn: json['actualizadoEn'] == null
      ? null
      : DateTime.parse(json['actualizadoEn'] as String),
);

Map<String, dynamic> _$UsuarioToJson(Usuario instance) => <String, dynamic>{
  'id': instance.id,
  'nombre': instance.nombre,
  'email': instance.email,
  'rol': _$RolEnumEnumMap[instance.rol]!,
  'imagenUrl': instance.imagenUrl,
  'creadoEn': instance.creadoEn?.toIso8601String(),
  'actualizadoEn': instance.actualizadoEn?.toIso8601String(),
};

const _$RolEnumEnumMap = {RolEnum.usuario: 'usuario', RolEnum.admin: 'admin'};

UsuarioCreate _$UsuarioCreateFromJson(Map<String, dynamic> json) =>
    UsuarioCreate(
      nombre: json['nombre'] as String,
      email: json['email'] as String,
      password: json['password'] as String,
    );

Map<String, dynamic> _$UsuarioCreateToJson(UsuarioCreate instance) =>
    <String, dynamic>{
      'nombre': instance.nombre,
      'email': instance.email,
      'password': instance.password,
    };

UsuarioUpdate _$UsuarioUpdateFromJson(Map<String, dynamic> json) =>
    UsuarioUpdate(
      nombre: json['nombre'] as String?,
      email: json['email'] as String?,
      password: json['password'] as String?,
      passwordActual: json['passwordActual'] as String?,
      rol: $enumDecodeNullable(_$RolEnumEnumMap, json['rol']),
      imagenUrl: json['imagenUrl'] as String?,
    );

Map<String, dynamic> _$UsuarioUpdateToJson(UsuarioUpdate instance) =>
    <String, dynamic>{
      'nombre': instance.nombre,
      'email': instance.email,
      'password': instance.password,
      'passwordActual': instance.passwordActual,
      'rol': _$RolEnumEnumMap[instance.rol],
      'imagenUrl': instance.imagenUrl,
    };

UsuarioLogin _$UsuarioLoginFromJson(Map<String, dynamic> json) => UsuarioLogin(
  email: json['email'] as String,
  password: json['password'] as String,
);

Map<String, dynamic> _$UsuarioLoginToJson(UsuarioLogin instance) =>
    <String, dynamic>{'email': instance.email, 'password': instance.password};

LoginResponse _$LoginResponseFromJson(Map<String, dynamic> json) =>
    LoginResponse(
      accessToken: json['access_token'] as String,
      tokenType: json['token_type'] as String,
      rol: json['rol'] as String,
    );

Map<String, dynamic> _$LoginResponseToJson(LoginResponse instance) =>
    <String, dynamic>{
      'access_token': instance.accessToken,
      'token_type': instance.tokenType,
      'rol': instance.rol,
    };
