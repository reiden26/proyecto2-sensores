from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario
import os
from dotenv import load_dotenv

load_dotenv()

# Seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "proyecto_2_sensor_jwt_secret_key_2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Cache simple en memoria para configuración global
_cfg_cache = {
    "last_fetch": None,
    "prolongar_sesion": False
}

def _should_refresh_cache() -> bool:
    if _cfg_cache["last_fetch"] is None:
        return True
    # refrescar cada 60s
    return (datetime.utcnow() - _cfg_cache["last_fetch"]).total_seconds() > 60

def _load_global_config(db: Session):
    try:
        from models import ConfiguracionSistema
        cfg = db.query(ConfiguracionSistema).first()
        if cfg is not None:
            _cfg_cache["prolongar_sesion"] = bool(getattr(cfg, "prolongar_sesion", False))
        _cfg_cache["last_fetch"] = datetime.utcnow()
    except Exception:
        # si falla, mantener defaults y no romper emisión
        _cfg_cache["last_fetch"] = datetime.utcnow()

def invalidate_config_cache():
    _cfg_cache["last_fetch"] = None

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None, db: Session | None = None):
    to_encode = data.copy()
    # Decidir expiración dinámica según configuración global
    minutes = ACCESS_TOKEN_EXPIRE_MINUTES
    if db is not None:
        if _should_refresh_cache():
            _load_global_config(db)
        # Prioridad: configuración por usuario si existe
        try:
            from models import ConfiguracionUsuario
            user_id = data.get("user_id") or data.get("id")
            if user_id:
                ucfg = db.query(ConfiguracionUsuario).filter(ConfiguracionUsuario.usuario_id == user_id).first()
                if ucfg and bool(getattr(ucfg, "prolongar_sesion", False)):
                    minutes = 60
                elif _cfg_cache.get("prolongar_sesion"):
                    minutes = 60
        except Exception:
            if _cfg_cache.get("prolongar_sesion"):
                minutes = 60
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(Usuario).filter(Usuario.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    # Verificar si la sesión del usuario sigue activa
    from models import SesionUsuario
    sesion_activa = db.query(SesionUsuario).filter(
        SesionUsuario.usuario_id == user.id,
        SesionUsuario.activo == True
    ).first()
    
    if not sesion_activa:
        raise HTTPException(status_code=401, detail="Sesión expirada")
    
    return user

def require_admin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.value != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return current_user
