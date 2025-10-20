# Proyecto2 - Sistema de Monitoreo de Sensores

Un sistema completo de monitoreo de sensores ambientales con aplicación web, móvil y API backend.

## Características Principales

### Monitoreo en Tiempo Real
- **Sensores MQ-135, MQ-4, MQ-7** para calidad del aire
- **Dashboard interactivo** con gráficos en tiempo real
- **Alertas automáticas** basadas en umbrales configurables
- **Comparación de sensores** con visualizaciones avanzadas

### Gestión de Usuarios
- **Sistema de roles** (Usuario/Administrador)
- **Autenticación JWT** segura
- **Perfiles de usuario** con imágenes personalizables
- **Configuración de notificaciones** personalizada

### Aplicaciones Múltiples
- **Aplicación Web** (Angular + Material 3)
- **App Móvil** (Flutter + Material 3)
- **API Backend** (FastAPI + MySQL)

### Reportes y Análisis
- **Exportación a PDF** con gráficos embebidos
- **Exportación a Excel** con datos detallados
- **Filtros avanzados** por fecha, sensor y severidad
- **Estadísticas comparativas** entre sensores

## Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend Web  │    │   App Móvil     │    │   API Backend   │
│   (Angular)     │    │   (Flutter)     │    │   (FastAPI)     │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Dashboard     │    │ • REST API      │
│ • Reportes      │    │ • Notificaciones│    │ • JWT Auth      │
│ • Configuración │    │ • Perfil        │    │ • WebSockets    │
│ • Admin Panel   │    │ • Configuración │    │ • MySQL DB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Base de Datos │
                    │   (MySQL)       │
                    │                 │
                    │ • Usuarios      │
                    │ • Sensores      │
                    │ • Lecturas      │
                    │ • Notificaciones│
                    └─────────────────┘
```

## Tecnologías Utilizadas

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para Python
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación segura
- **Alembic** - Migraciones de base de datos

### Frontend Web
- **Angular 17** - Framework de aplicaciones web
- **Angular Material 3** - Componentes de UI
- **Chart.js** - Gráficos interactivos
- **jsPDF** - Generación de PDFs
- **ExcelJS** - Exportación a Excel

### App Móvil
- **Flutter 3.0** - Framework de desarrollo móvil
- **Riverpod** - Gestión de estado
- **Material 3** - Diseño moderno
- **SharedPreferences** - Persistencia local
- **Image Picker** - Selección de imágenes

### Servicios Externos
- **Cloudinary** - Almacenamiento de imágenes
- **JWT.io** - Tokens de autenticación

## Instalación y Configuración

### Prerrequisitos
- Python 3.8+
- Node.js 16+
- Flutter 3.0+
- MySQL 8.0+

### 1. Clonar el Repositorio
```bash
git clone https://github.com/reide26/proyecto2.git
cd proyecto2
```

### 2. Configurar Backend
```bash
cd backend
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
python main.py
```

### 3. Configurar Frontend Web
```bash
cd frontend
npm install

# Configurar API URL
# Editar src/environments/environment.ts

# Iniciar servidor de desarrollo
ng serve
```

### 4. Configurar App Móvil
```bash
cd movilflutter
flutter pub get

# Configurar API URL
# Editar lib/constants/api_constants.dart

# Ejecutar en dispositivo/emulador
flutter run
```

## Configuración de Desarrollo

### Variables de Entorno
```env
# Backend
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/proyecto2
SECRET_KEY=tu_clave_super_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Base de Datos
```sql
CREATE DATABASE proyecto2;
USE proyecto2;

-- Las tablas se crean automáticamente con Alembic
```

## API Endpoints

### Autenticación
- `POST /login` - Iniciar sesión
- `GET /usuario/actual` - Usuario actual
- `PUT /usuarios/{id}` - Actualizar usuario

### Sensores
- `GET /sensores` - Listar sensores
- `GET /sensores/{id}/lecturas` - Lecturas de sensor
- `POST /sensores/{id}/lecturas` - Nueva lectura

### Notificaciones
- `GET /notificaciones/me` - Mis notificaciones
- `PUT /notificaciones/{id}/leer` - Marcar como leída
- `PUT /notificaciones/leer-todas` - Marcar todas como leídas

### Reportes
- `GET /reportes/usuarios` - Reportes de usuario
- `GET /admin/reportes` - Reportes de administrador

## Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
ng test
ng e2e
```

### App Móvil
```bash
cd movilflutter
flutter test
flutter drive --target=test_driver/app.dart
```

## Deployment

### Backend (Docker)
```bash
cd backend
docker build -t proyecto2-backend .
docker run -p 8000:8000 proyecto2-backend
```

### Frontend (Netlify/Vercel)
```bash
cd frontend
ng build --prod
# Subir archivos de dist/ a tu servicio de hosting
```

### App Móvil
```bash
cd movilflutter
# Android
flutter build apk --release

# iOS
flutter build ios --release
```


### Métricas
- **Uptime:** Monitoreo de disponibilidad
- **Performance:** Tiempo de respuesta API
- **Errores:** Tracking de errores y excepciones

## Seguridad

### Autenticación
- **JWT Tokens** con expiración configurable
- **Bcrypt** para hash de contraseñas
- **CORS** configurado para desarrollo y producción

### Validación
- **Pydantic** para validación de datos
- **SQLAlchemy** para prevención de SQL injection
- **Sanitización** de inputs del usuario


### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- **Python:** PEP 8
- **TypeScript:** ESLint + Prettier
- **Dart:** Dart Analysis
- **Commits:** Conventional Commits

## Documentación

- [Guía de Desarrollo](DEVELOPMENT.md)
- [Changelog](CHANGELOG.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## Problemas Conocidos

### Notificaciones Móviles
- **Problema:** Notificaciones limpiadas reaparecían
- **Estado:** Resuelto en v2.0.0
- **Solución:** Persistencia con SharedPreferences

### Exportación de Reportes
- **Problema:** Gráficos no se incluían en PDF
- **Estado:** Resuelto en v2.0.0
- **Solución:** Captura de canvas y embebido


## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.


---

**Desarrollado por el equipo de Proyecto2**

*Última actualización: 2025-10-1*
*Versión: 2.0.0*
