#!/bin/bash

# Script de instalación automatizada para Proyecto2
# Este script configura el entorno de desarrollo completo

set -e

echo "🚀 Iniciando instalación de Proyecto2..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    print_status "Verificando prerrequisitos..."
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 no está instalado. Por favor instala Python 3.8+"
        exit 1
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instala Node.js 16+"
        exit 1
    fi
    
    # Verificar Flutter
    if ! command -v flutter &> /dev/null; then
        print_error "Flutter no está instalado. Por favor instala Flutter 3.0+"
        exit 1
    fi
    
    # Verificar MySQL
    if ! command -v mysql &> /dev/null; then
        print_warning "MySQL no está instalado. Necesitarás configurarlo manualmente"
    fi
    
    print_success "Prerrequisitos verificados"
}

# Configurar backend
setup_backend() {
    print_status "Configurando backend..."
    
    cd backend
    
    # Crear entorno virtual
    if [ ! -d "venv" ]; then
        print_status "Creando entorno virtual..."
        python3 -m venv venv
    fi
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Instalar dependencias
    print_status "Instalando dependencias de Python..."
    pip install -r requirements.txt
    
    # Configurar variables de entorno
    if [ ! -f ".env" ]; then
        print_status "Creando archivo de configuración..."
        cp ../env.example .env
        print_warning "Por favor edita el archivo .env con tus configuraciones"
    fi
    
    cd ..
    print_success "Backend configurado"
}

# Configurar frontend
setup_frontend() {
    print_status "Configurando frontend..."
    
    cd frontend
    
    # Instalar dependencias
    print_status "Instalando dependencias de Node.js..."
    npm install
    
    # Configurar Angular CLI globalmente si no está instalado
    if ! command -v ng &> /dev/null; then
        print_status "Instalando Angular CLI..."
        npm install -g @angular/cli
    fi
    
    cd ..
    print_success "Frontend configurado"
}

# Configurar app móvil
setup_mobile() {
    print_status "Configurando app móvil..."
    
    cd movilflutter
    
    # Instalar dependencias
    print_status "Instalando dependencias de Flutter..."
    flutter pub get
    
    # Verificar configuración de Flutter
    print_status "Verificando configuración de Flutter..."
    flutter doctor
    
    cd ..
    print_success "App móvil configurada"
}

# Configurar base de datos
setup_database() {
    print_status "Configurando base de datos..."
    
    # Verificar si MySQL está disponible
    if command -v mysql &> /dev/null; then
        print_status "Creando base de datos..."
        mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS proyecto2;"
        print_success "Base de datos creada"
    else
        print_warning "MySQL no está disponible. Configura la base de datos manualmente:"
        print_warning "CREATE DATABASE proyecto2;"
    fi
}

# Crear archivos de configuración
create_config_files() {
    print_status "Creando archivos de configuración..."
    
    # Crear directorio de logs
    mkdir -p backend/logs
    
    # Crear archivo de configuración de desarrollo
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: proyecto2
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql+pymysql://root:password@mysql:3306/proyecto2
    depends_on:
      - mysql
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
    depends_on:
      - backend

volumes:
  mysql_data:
EOF

    print_success "Archivos de configuración creados"
}

# Función principal
main() {
    echo "🌟 Proyecto2 - Sistema de Monitoreo de Sensores"
    echo "================================================"
    
    check_prerequisites
    setup_backend
    setup_frontend
    setup_mobile
    setup_database
    create_config_files
    
    echo ""
    echo "🎉 ¡Instalación completada!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Configura las variables de entorno en backend/.env"
    echo "2. Inicia la base de datos MySQL"
    echo "3. Ejecuta las migraciones: cd backend && alembic upgrade head"
    echo "4. Inicia el backend: cd backend && python main.py"
    echo "5. Inicia el frontend: cd frontend && ng serve"
    echo "6. Inicia la app móvil: cd movilflutter && flutter run"
    echo ""
    echo "📚 Documentación:"
    echo "- README.md - Información general"
    echo "- DEVELOPMENT.md - Guía de desarrollo"
    echo "- CHANGELOG.md - Historial de cambios"
    echo ""
    echo "🚀 ¡Disfruta desarrollando!"
}

# Ejecutar función principal
main "$@"
