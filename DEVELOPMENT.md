# Guía de Desarrollo - Proyecto2

## Arquitectura del Proyecto

### Estructura de Directorios
```
Proyecto2/
├── backend/                 # API FastAPI
│   ├── main.py             # Aplicación principal
│   ├── models.py           # Modelos de base de datos
│   ├── schemas.py          # Esquemas Pydantic
│   ├── auth.py             # Autenticación JWT
│   ├── database.py         # Configuración de BD
│   └── logs/               # Logs de aplicación
├── frontend/               # Aplicación Angular
│   ├── src/app/            # Componentes y servicios
│   ├── src/environments/   # Configuraciones
│   └── public/             # Assets estáticos
├── movilflutter/           # App móvil Flutter
│   ├── lib/                # Código Dart
│   ├── android/            # Configuración Android
│   ├── ios/                # Configuración iOS
│   └── assets/             # Recursos de la app
└── lib/                    # Librerías compartidas
```

## Configuración del Entorno de Desarrollo

### Prerrequisitos
- **Python 3.8+**
- **Node.js 16+**
- **Flutter 3.0+**
- **MySQL 8.0+**
- **Git**

### Backend (FastAPI)

#### 1. Configuración de Base de Datos
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE proyecto2;
```

#### 2. Variables de Entorno
Crear archivo `.env` en `backend/`:
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/proyecto2
SECRET_KEY=tu_clave_super_secreta_y_muy_larga_para_jwt_2024_proyecto2
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### 3. Instalación y Ejecución
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend (Angular)

#### 1. Instalación
```bash
cd frontend
npm install
```

#### 2. Configuración
Archivo `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000'
};
```

#### 3. Ejecución
```bash
ng serve
```

### App Móvil (Flutter)

#### 1. Instalación
```bash
cd movilflutter
flutter pub get
```

#### 2. Configuración
Archivo `lib/constants/api_constants.dart`:
```dart
class ApiConstants {
  static const String baseUrl = 'http://localhost:8000';
  // ... otros endpoints
}
```

#### 3. Ejecución
```bash
# Android
flutter run

# iOS
flutter run -d ios
```

## Nuevas Funcionalidades Implementadas

### Sistema de Imágenes de Perfil

#### Backend
- Campo `imagen_url` en tabla `usuarios`
- Endpoints actualizados para incluir imagen
- JWT tokens con información de imagen

#### Frontend Web
- Modal `ImageEditModalComponent`
- Integración con Cloudinary
- Sincronización automática

#### App Móvil
- Modal Material 3 para edición
- Selección de imágenes nativa
- Persistencia de estado

### Notificaciones Persistentes

#### App Móvil
- `SharedPreferences` para persistencia
- Filtrado inteligente de notificaciones
- Estado mantenido entre sesiones

### Reportes Mejorados

#### Frontend Web
- Exportación PDF con gráficos
- Exportación Excel con `exceljs`
- Filtros con toggles Material 3

## Base de Datos

### Esquema Actualizado
```sql
-- Tabla usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    imagen_url VARCHAR(500) DEFAULT 'https://res.cloudinary.com/duzmmuisk/image/upload/v1758840939/default_qljbtb.svg' NULL
);
```

### Migración de Datos
```sql
-- Agregar campo imagen_url a usuarios existentes
ALTER TABLE usuarios ADD COLUMN imagen_url VARCHAR(500) DEFAULT 'https://res.cloudinary.com/duzmmuisk/image/upload/v1758840939/default_qljbtb.svg' NULL;
```

## Autenticación y Seguridad

### JWT Tokens
```python
# Payload del token
{
    "user_id": 1,
    "email": "usuario@ejemplo.com",
    "rol": "usuario",
    "imagen_url": "https://...",
    "exp": 1234567890
}
```

### Endpoints de Autenticación
- `POST /login` - Iniciar sesión
- `GET /usuario/actual` - Usuario actual
- `PUT /usuarios/{id}` - Actualizar usuario

## Desarrollo Móvil

### Flutter Riverpod
```dart
// Provider de notificaciones
final notificationStateProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  return NotificationNotifier(ref.read(notificationServiceProvider));
});
```

### Persistencia Local
```dart
// SharedPreferences para notificaciones
final prefs = await SharedPreferences.getInstance();
await prefs.setString('cleared_notifications', json.encode(clearedIds));
```

## Testing

### Backend
```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio

# Ejecutar tests
pytest
```

### Frontend
```bash
# Tests unitarios
ng test

# Tests e2e
ng e2e
```

### App Móvil
```bash
# Tests unitarios
flutter test

# Tests de integración
flutter drive --target=test_driver/app.dart
```

## Deployment

### Backend
```bash
# Usando Docker
docker build -t proyecto2-backend .
docker run -p 8000:8000 proyecto2-backend

# Usando uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Build de producción
ng build --prod

# Servir archivos estáticos
npx serve -s dist/proyecto2
```

### App Móvil
```bash
# Build Android
flutter build apk --release

# Build iOS
flutter build ios --release
```

## Debugging

### Backend
- Logs en `backend/logs/`
- Debug mode con `uvicorn main:app --reload`

### Frontend
- DevTools del navegador
- Angular DevTools extension

### App Móvil
- Flutter Inspector
- Dart DevTools
- Logs con `flutter logs`

## 📚 Recursos Útiles

### Documentación
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Angular Docs](https://angular.io/docs)
- [Flutter Docs](https://flutter.dev/docs)

### Herramientas
- [Postman](https://www.postman.com/) - Testing de API
- [Dart DevTools](https://dart.dev/tools/dart-devtools) - Debugging Flutter
- [Angular DevTools](https://angular.io/guide/devtools) - Debugging Angular

## 🐛 Problemas Conocidos y Soluciones

### Notificaciones Móviles
**Problema:** Notificaciones limpiadas reaparecían
**Solución:** Implementada persistencia con SharedPreferences

### Exportación de Reportes
**Problema:** Gráficos no se incluían en PDF
**Solución:** Captura de canvas y embebido

### Imágenes de Perfil
**Problema:** Pixelación en imágenes
**Solución:** `object-fit: contain` y padding

## 🔄 Flujo de Desarrollo

1. **Crear rama feature**
2. **Desarrollar funcionalidad**
3. **Testing local**
4. **Commit y push**
5. **Pull request**
6. **Code review**
7. **Merge a main**

## 📋 Checklist de Desarrollo

### Antes de Commit
- [ ] Tests pasando
- [ ] Linting sin errores
- [ ] Documentación actualizada
- [ ] Changelog actualizado

### Antes de Deploy
- [ ] Tests de integración
- [ ] Build de producción
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada

---

**Última actualización:** 2025-01-02
**Versión:** 2.0.0
