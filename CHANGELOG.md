# Changelog - Proyecto2

## [2025-01-02] - Actualización de Funcionalidades

### Nuevas Funcionalidades

#### Sistema de Imágenes de Perfil
- **Backend:**
  - Agregado campo `imagen_url` a la tabla `usuarios`
  - Endpoint `/usuarios/{usuario_id}` ahora incluye `imagen_url`
  - Endpoint `/usuario/actual` incluye `imagen_url` en respuesta
  - JWT token ahora incluye `imagen_url` en el payload
  - Endpoint `PUT /usuarios/{usuario_id}` soporta actualización de `imagen_url`

- **Frontend Web:**
  - Modal profesional para edición de imagen de perfil (`ImageEditModalComponent`)
  - Soporte para URL de imagen y subida de archivos
  - Integración con Cloudinary para almacenamiento de imágenes
  - Sincronización automática de imagen entre sidebar y configuración
  - Aplicado tanto para usuarios como administradores

- **App Móvil (Flutter):**
  - Modal Material 3 para edición de imagen de perfil
  - Soporte para URL de imagen y selección de archivos
  - Integración con Cloudinary para subida de imágenes
  - Sincronización automática en dashboard y perfil
  - Diseño responsive y profesional

#### Mejoras en Sistema de Notificaciones
- **App Móvil:**
  - Implementada persistencia de notificaciones limpiadas usando SharedPreferences
  - Las notificaciones marcadas como "limpiadas" no vuelven a aparecer
  - Lógica de filtrado mejorada que restaura notificaciones si vuelven a estar no leídas
  - Estado persistente entre sesiones de la aplicación

#### Mejoras en Reportes
- **Frontend Web:**
  - Exportación a PDF con gráficos comparativos embebidos
  - Exportación a Excel con imágenes usando `exceljs`
  - Filtros convertidos de checkboxes a toggles (Material 3)
  - Validación visual para botón "Generar Reporte" inactivo
  - Diseño mejorado y profesional de filtros

#### Mejoras de UI/UX
- **Frontend Web:**
  - Colores consistentes: verde para usuarios, azul para administradores
  - Iconos con gradientes oscuros en dashboard
  - Botones "Activar Todos" (verde) y "Desactivar Todos" (rojo)
  - Input de búsqueda sin bordes (Material 3)
  - Headers consistentes en todas las páginas

### Cambios Técnicos

#### Backend
- **Modelos:**
  ```python
  # Usuario model
  imagen_url = Column(String(500), default='https://res.cloudinary.com/duzmmuisk/image/upload/v1758840939/default_qljbtb.svg', nullable=True)
  ```

- **Schemas:**
  ```python
  # UsuarioUpdate y UsuarioOut
  imagen_url: Optional[str] = None
  ```

- **Endpoints modificados:**
  - `GET /usuarios/{usuario_id}` - Incluye `imagen_url`
  - `GET /usuario/actual` - Incluye `imagen_url`
  - `POST /login` - JWT incluye `imagen_url`
  - `PUT /usuarios/{usuario_id}` - Soporta `imagen_url`

#### Frontend Web
- **Nuevos componentes:**
  - `ImageEditModalComponent` - Modal para edición de imágenes
  - Templates HTML extraídos de componentes TypeScript

- **Servicios actualizados:**
  - `UsuarioService` - Método `loadCurrentUser()`
  - Integración con Cloudinary para subida de archivos

#### App Móvil
- **Nuevas dependencias:**
  - `image_picker: ^1.0.7` - Para selección de imágenes
  - `shared_preferences` - Para persistencia de estado

- **Nuevos archivos:**
  - `lib/screens/profile/image_edit_modal.dart` - Modal de edición
  - Lógica de persistencia en `notification_provider.dart`

### Funcionalidades Móviles

#### Gestión de Imágenes
- Selección de imagen desde galería o cámara
- Subida directa a Cloudinary
- Preview en tiempo real
- Validación de formatos y tamaños

#### Notificaciones Persistentes
- Estado de notificaciones limpiadas se mantiene entre sesiones
- Filtrado inteligente que restaura notificaciones no leídas
- Sincronización con backend manteniendo estado local

### Base de Datos

#### Cambios en Esquema
```sql
-- Tabla usuarios
ALTER TABLE usuarios ADD COLUMN imagen_url VARCHAR(500) DEFAULT 'https://res.cloudinary.com/duzmmuisk/image/upload/v1758840939/default_qljbtb.svg' NULL;
```

### Seguridad

#### JWT Tokens
- Payload ahora incluye `imagen_url` para acceso eficiente
- Tokens actualizados automáticamente al cambiar imagen

#### Cloudinary
- Upload presets configurados como `unsigned`
- Validación de tipos de archivo en frontend
- URLs seguras para almacenamiento de imágenes

### Dependencias

#### Backend (requirements.txt)
- Dependencias organizadas por categorías
- Versiones específicas para estabilidad
- Dependencias opcionales comentadas

#### Frontend Web
- `exceljs` - Para exportación avanzada de Excel
- Integración con Cloudinary API

#### App Móvil
- `image_picker: ^1.0.7` - Selección de imágenes
- `shared_preferences` - Persistencia local

### Instalación y Configuración

#### Backend
```bash
pip install -r requirements.txt
```

#### Frontend Web
```bash
npm install
```

#### App Móvil
```bash
flutter pub get
```

### 🔄 Migración de Datos

#### Usuarios Existentes
- Todos los usuarios existentes reciben imagen por defecto
- Campo `imagen_url` es opcional y retrocompatible

### Próximas Funcionalidades

#### Planificadas
- [ ] Herramienta de administrador para crear alertas personalizadas
- [ ] Notificaciones push en app móvil
- [ ] Modo offline para app móvil
- [ ] Dashboard de analytics avanzado

### Correcciones

#### Notificaciones Móviles
- **Problema:** Notificaciones limpiadas reaparecían al reabrir app
- **Solución:** Implementada persistencia con SharedPreferences
- **Resultado:** Estado de notificaciones se mantiene entre sesiones

#### Exportación de Reportes
- **Problema:** Gráficos no se incluían en PDF/Excel
- **Solución:** Captura de canvas y embebido en documentos
- **Resultado:** Reportes completos con visualizaciones

### Métricas de Cambios

- **Archivos modificados:** 25+
- **Nuevos componentes:** 3
- **Nuevas dependencias:** 2
- **Líneas de código agregadas:** 1000+
- **Funcionalidades nuevas:** 5

---

**Nota:** Esta actualización mantiene compatibilidad completa con versiones anteriores y no requiere migración de datos para usuarios existentes.
