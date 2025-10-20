from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime
from enum import Enum

# Roles posibles
class RolEnum(str, Enum):
    usuario = "usuario"
    admin = "admin"

# Para crear usuario
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str

# Para actualizar usuario
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    password_actual: Optional[str] = None
    rol: Optional[RolEnum] = None
    imagen_url: Optional[str] = None



# Para mostrar usuario (respuesta)
class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: RolEnum
    imagen_url: Optional[str] = None
    creado_en: datetime.datetime
    actualizado_en: Optional[datetime.datetime]

    class Config:
        from_attributes = True  


class UsuarioLogin(BaseModel):
    email: str
    password: str


# --------- Sensores y Lecturas ---------

class SensorOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class UsuarioSensorUpdate(BaseModel):
    asignados: list[int]


class EstadoLecturaEnum(str, Enum):
    bueno = "bueno"
    advertencia = "advertencia"
    malo = "malo"


class LecturaCreate(BaseModel):
    sensor_codigo: str
    valor: float
    estado: EstadoLecturaEnum


class LecturaCreateDevice(BaseModel):
    lecturas: list[LecturaCreate]


class LecturaOut(BaseModel):
    id: int
    sensor_id: int
    usuario_id: int
    valor: float
    estado: EstadoLecturaEnum
    creado_en: datetime.datetime

    class Config:
        from_attributes = True


# --------- Sesiones de captura ---------

class SesionOut(BaseModel):
    id: int
    usuario_id: int
    sensor_codigo: str
    iniciado_en: datetime.datetime
    finalizado_en: Optional[datetime.datetime] = None
    activo: bool
    total_lecturas: int

    class Config:
        from_attributes = True


class SesionHistorialOut(BaseModel):
    id: int
    sensor_codigo: str
    iniciado_en: datetime.datetime
    finalizado_en: Optional[datetime.datetime] = None
    duracion: Optional[str] = None
    total_lecturas: int
    promedio_valor: Optional[float] = None
    max_valor: Optional[float] = None
    min_valor: Optional[float] = None

    class Config:
        from_attributes = True


# --------- Notificaciones ---------

class NotificacionOut(BaseModel):
    id: int
    usuario_id: int
    sensor_codigo: str
    valor: float
    estado: str
    titulo: str
    mensaje: str
    tipo: str
    leida: bool
    creado_en: datetime.datetime
    leido_en: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class EstadoNotificacionEnum(str, Enum):
    bueno = "bueno"
    advertencia = "advertencia"
    malo = "malo"
    desconectado = "desconectado"


class TipoNotificacionEnum(str, Enum):
    info = "info"
    warning = "warning"
    danger = "danger"


class NotificacionCreate(BaseModel):
    usuario_id: int
    sensor_codigo: str
    valor: float
    estado: EstadoNotificacionEnum
    titulo: str
    mensaje: str
    tipo: TipoNotificacionEnum
    leida: Optional[bool] = False


class NotificacionUpdate(BaseModel):
    usuario_id: Optional[int] = None
    sensor_codigo: Optional[str] = None
    valor: Optional[float] = None
    estado: Optional[EstadoNotificacionEnum] = None
    titulo: Optional[str] = None
    mensaje: Optional[str] = None
    tipo: Optional[TipoNotificacionEnum] = None
    leida: Optional[bool] = None

# -------- Configuración global del sistema --------
class ConfiguracionSistemaOut(BaseModel):
    prolongar_sesion: bool
    mq135_warning_threshold: float
    mq135_bad_threshold: float
    mq4_warning_threshold: float
    mq4_bad_threshold: float
    mq7_warning_threshold: float
    mq7_bad_threshold: float
    mq135_trigger_valor: Optional[float] = None
    mq135_trigger_tipo: Optional[str] = None
    mq4_trigger_valor: Optional[float] = None
    mq4_trigger_tipo: Optional[str] = None
    mq7_trigger_valor: Optional[float] = None
    mq7_trigger_tipo: Optional[str] = None
    # ya no exponemos flags de inclusión ni reglas de volumen

    class Config:
        orm_mode = True

class ConfiguracionSistemaUpdate(BaseModel):
    prolongar_sesion: Optional[bool] = None
    mq135_warning_threshold: Optional[float] = None
    mq135_bad_threshold: Optional[float] = None
    mq4_warning_threshold: Optional[float] = None
    mq4_bad_threshold: Optional[float] = None
    mq7_warning_threshold: Optional[float] = None
    mq7_bad_threshold: Optional[float] = None
    mq135_trigger_valor: Optional[float] = None
    mq135_trigger_tipo: Optional[str] = None
    mq4_trigger_valor: Optional[float] = None
    mq4_trigger_tipo: Optional[str] = None
    mq7_trigger_valor: Optional[float] = None
    mq7_trigger_tipo: Optional[str] = None
    # ya no recibimos flags de inclusión ni reglas de volumen

# -------- Configuración por usuario --------
class ConfiguracionUsuarioOut(BaseModel):
    usuario_id: int
    prolongar_sesion: bool
    class Config:
        orm_mode = True

class ConfiguracionUsuarioUpdate(BaseModel):
    prolongar_sesion: Optional[bool] = None

class ConfiguracionNotificacionesOut(BaseModel):
    id: int
    usuario_id: int
    notify_mq135_good: bool
    notify_mq135_warning: bool
    notify_mq135_bad: bool
    notify_mq7_good: bool
    notify_mq7_warning: bool
    notify_mq7_bad: bool
    notify_mq4_good: bool
    notify_mq4_warning: bool
    notify_mq4_bad: bool
    creado_en: datetime.datetime
    actualizado_en: datetime.datetime

    class Config:
        from_attributes = True


class ConfiguracionNotificacionesUpdate(BaseModel):
    notify_mq135_good: Optional[bool] = None
    notify_mq135_warning: Optional[bool] = None
    notify_mq135_bad: Optional[bool] = None
    notify_mq7_good: Optional[bool] = None
    notify_mq7_warning: Optional[bool] = None
    notify_mq7_bad: Optional[bool] = None
    notify_mq4_good: Optional[bool] = None
    notify_mq4_warning: Optional[bool] = None
    notify_mq4_bad: Optional[bool] = None