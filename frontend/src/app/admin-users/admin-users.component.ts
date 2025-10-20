import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationService } from '../shared/notification/notification.service';
import { UsuarioService, Usuario, UsuarioUpdate } from '../services/usuario.service';
import { ConfirmDeleteUserDialogComponent } from './confirm-delete-user-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatSlideToggleModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit, AfterViewInit {
  usuarios: Usuario[] = [];
  dataSource = new MatTableDataSource<Usuario>([]);
  displayedColumns: string[] = ['id', 'nombre', 'email', 'rol', 'sensores', 'acciones'];
  searchTerm: string = '';
  selectedUsuario: Usuario | null = null;
  isLoading: boolean = false;
  
  // Formulario para crear/editar
  formData = {
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario'
  };

  // Sensores
  sensoresDisponibles: any[] = [];
  sensoresAsignaciones: { [usuarioId: number]: any[] } = {};
  isLoadingSensores = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usuarioService: UsuarioService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarSensores();
  }

  ngAfterViewInit(): void {
    // Configurar paginador y sort cuando estén disponibles
    setTimeout(() => {
      this.configurePaginatorAndSort();
    }, 0);
  }

  cargarUsuarios(): void {
    // Evitar múltiples cargas simultáneas
    if (this.isLoading) {
      console.log('Ya hay una carga en progreso, ignorando...');
      return;
    }
    
    this.isLoading = true;
    
    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Timeout al cargar usuarios');
        this.isLoading = false;
      }
    }, 10000); // 10 segundos timeout
    
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        clearTimeout(timeoutId); // Limpiar timeout
        this.usuarios = [...data];
        
        // Crear nuevo dataSource
        this.dataSource = new MatTableDataSource<Usuario>(this.usuarios);
        
        // Configurar filtro personalizado
        this.dataSource.filterPredicate = (usuario: Usuario, filter: string) => {
          const term = filter.trim().toLowerCase();
          return (
            usuario.nombre.toLowerCase().includes(term) ||
            usuario.email.toLowerCase().includes(term) ||
            usuario.rol.toLowerCase().includes(term)
          );
        };
        
        this.isLoading = false;
        
        // Configurar paginador y sort después de que la vista se actualice
        setTimeout(() => {
          this.configurePaginatorAndSort();
          // Cargar sensores asignados de todos los usuarios para mostrar chips inmediatamente
          this.usuarios.forEach(u => {
            this.usuarioService.obtenerSensoresUsuario(u.id).subscribe({
              next: (resp) => {
                this.sensoresAsignaciones[u.id] = resp?.sensores || [];
              },
              error: () => {
                this.sensoresAsignaciones[u.id] = [];
              }
            });
          });
        }, 100);
      },
      error: (error) => {
        clearTimeout(timeoutId); // Limpiar timeout
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
        this.notificationService.showUserError('cargar usuarios', 'Error al cargar la lista de usuarios');
      }
    });
  }

  filtrarUsuarios(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  onPageChange(event: any): void {
    console.log('Cambio de página:', event);
    // El paginador debería funcionar automáticamente
  }

  getTotalUsers(): number {
    return this.dataSource.filteredData.filter(user => user.rol === 'usuario').length;
  }

  getAdminUsers(): number {
    return this.dataSource.filteredData.filter(user => user.rol === 'admin').length;
  }


  private configurePaginatorAndSort(): void {
    if (this.paginator && this.dataSource) {
      // Desconectar paginador anterior si existe
      if (this.dataSource.paginator) {
        this.dataSource.paginator = null;
      }
      
      // Conectar nuevo paginador
      this.dataSource.paginator = this.paginator;
      
      console.log('Paginador configurado:', {
        totalItems: this.dataSource.data.length,
        pageSize: this.paginator.pageSize,
        pageIndex: this.paginator.pageIndex,
        filteredData: this.dataSource.filteredData.length,
        hasPaginator: !!this.dataSource.paginator
      });
    }
    if (this.sort && this.dataSource) {
      this.dataSource.sort = this.sort;
    }
  }

  abrirCrearModal(templateRef: any): void {
    this.formData = { nombre: '', email: '', password: '', rol: 'usuario' };
    this.dialog.open(templateRef, { width: '420px' });
  }

  crearUsuario(): void {
    if (!this.formData.nombre || !this.formData.email || !this.formData.password) {
      this.notificationService.showUserWarning('Por favor complete todos los campos requeridos');
      return;
    }

    this.usuarioService.crearUsuario(this.formData).subscribe({
      next: (response) => {
        this.notificationService.showUserCreated();
        this.dialog.closeAll();
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.notificationService.showUserError('crear usuario', error.error?.detail || 'Error desconocido');
      }
    });
  }

  abrirEditarModal(usuario: Usuario, templateRef: any): void {
    this.selectedUsuario = usuario;
    this.formData = {
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol
    };
    this.dialog.open(templateRef, { width: '420px' });
  }

  actualizarUsuario(): void {
    if (!this.selectedUsuario) return;

    const updateData: any = {};
    if (this.formData.nombre) updateData.nombre = this.formData.nombre;
    if (this.formData.email) updateData.email = this.formData.email;
    if (this.formData.password) updateData.password = this.formData.password;
    if (this.formData.rol) updateData.rol = this.formData.rol;

    this.usuarioService.actualizarUsuario(this.selectedUsuario.id, updateData).subscribe({
      next: (response) => {
        this.notificationService.showUserUpdated();
        this.dialog.closeAll();
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.notificationService.showUserError('actualizar usuario', error.error?.detail || 'Error desconocido');
      }
    });
  }

  abrirEliminarConfirm(usuario: Usuario): void {
    this.selectedUsuario = usuario;
    
    // Obtener sensores asignados al usuario
    const sensoresAsignados = this.getSensoresAsignados(usuario.id);
    const sensoresNombres = sensoresAsignados.length > 0 
      ? sensoresAsignados.map(s => s.nombre)
      : ['Sin sensores asignados'];
    
    const dialogRef = this.dialog.open(ConfirmDeleteUserDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Eliminación de Usuario',
        message: '¿Estás seguro de que quieres eliminar este usuario del sistema?',
        userName: usuario.nombre,
        userEmail: usuario.email,
        userRole: usuario.rol,
        userSensors: sensoresNombres
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarUsuario();
      }
    });
  }

  eliminarUsuario(): void {
    if (!this.selectedUsuario) return;

    this.usuarioService.eliminarUsuario(this.selectedUsuario.id).subscribe({
      next: (response) => {
        this.notificationService.showUserDeleted();
        this.dialog.closeAll();
        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.notificationService.showUserError('eliminar usuario', error.error?.detail || 'Error desconocido');
      }
    });
  }

  // Métodos para manejar sensores
  cargarSensores(): void {
    this.usuarioService.getSensores().subscribe({
      next: (sensores) => {
        // Mapear a la estructura usada en UI con bandera asignado=false por defecto
        this.sensoresDisponibles = (sensores || []).map((s: any) => ({
          id: s.id,
          codigo: s.codigo,
          nombre: s.nombre,
          descripcion: s.descripcion,
          asignado: false
        }));
      },
      error: (error) => {
        console.error('Error al cargar catálogo de sensores:', error);
        // Fallback visual: mantener arreglo vacío para mostrar "Sin sensores"
        this.sensoresDisponibles = [];
      }
    });
  }

  getSensoresAsignados(usuarioId: number): any[] {
    return this.sensoresAsignaciones[usuarioId] || [];
  }

  getSensorIcon(codigo: string): string {
    switch (codigo) {
      case 'mq135': return 'air';
      case 'mq4': return 'gas_meter';
      case 'mq7': return 'warning';
      default: return 'sensors';
    }
  }

  abrirGestionarSensores(usuario: Usuario, templateRef: any): void {
    this.selectedUsuario = usuario;
    
    // Cargar sensores asignados al usuario
    this.cargarSensoresAsignados(usuario.id);
    
    this.dialog.open(templateRef, { 
      width: '600px',
      maxHeight: '80vh'
    });
  }

  cargarSensoresAsignados(usuarioId: number): void {
    this.usuarioService.obtenerSensoresUsuario(usuarioId).subscribe({
      next: (data) => {
        // Resetear todos los sensores como no asignados
        this.sensoresDisponibles.forEach(sensor => {
          sensor.asignado = false;
        });
        
        // Marcar como asignados los que vienen del backend
        data.sensores.forEach((sensorAsignado: any) => {
          const sensor = this.sensoresDisponibles.find(s => s.codigo === sensorAsignado.codigo);
          if (sensor) {
            sensor.asignado = true;
          }
        });
        
        // Actualizar las asignaciones locales
        this.sensoresAsignaciones[usuarioId] = data.sensores;
      },
      error: (error) => {
        console.error('Error al cargar sensores del usuario:', error);
        this.notificationService.showUserError('cargar sensores', 'Error al cargar los sensores asignados');
      }
    });
  }

  onSensorToggle(sensor: any): void {
    // El toggle ya cambia el estado automáticamente
    console.log(`Sensor ${sensor.nombre} ${sensor.asignado ? 'asignado' : 'desasignado'}`);
  }

  guardarSensores(): void {
    if (!this.selectedUsuario) return;

    this.isLoadingSensores = true;
    
    // Obtener sensores actualmente asignados
    const sensoresActuales = this.sensoresAsignaciones[this.selectedUsuario.id] || [];
    const sensoresActualesCodigos = sensoresActuales.map(s => s.codigo);
    
    // Obtener sensores que deben estar asignados
    const sensoresNuevos = this.sensoresDisponibles.filter(s => s.asignado);
    const sensoresNuevosCodigos = sensoresNuevos.map(s => s.codigo);
    
    // Determinar qué sensores agregar y cuáles quitar
    const sensoresAAgregar = sensoresNuevosCodigos.filter(codigo => !sensoresActualesCodigos.includes(codigo));
    const sensoresAQuitar = sensoresActualesCodigos.filter(codigo => !sensoresNuevosCodigos.includes(codigo));
    
    // Crear array de operaciones
    const operaciones: Promise<any>[] = [];
    
    // Agregar sensores
    sensoresAAgregar.forEach(codigo => {
      const sensor = this.sensoresDisponibles.find(s => s.codigo === codigo);
      if (sensor) {
        operaciones.push(
          this.usuarioService.asignarSensor(this.selectedUsuario!.id, sensor.id).toPromise()
        );
      }
    });
    
    // Quitar sensores
    sensoresAQuitar.forEach(codigo => {
      const sensor = this.sensoresDisponibles.find(s => s.codigo === codigo);
      if (sensor) {
        operaciones.push(
          this.usuarioService.desasignarSensor(this.selectedUsuario!.id, sensor.id).toPromise()
        );
      }
    });
    
    // Ejecutar todas las operaciones
    Promise.all(operaciones).then(() => {
      // Tras aplicar cambios, recargar desde backend para asegurar verdad del servidor
      return this.usuarioService.obtenerSensoresUsuario(this.selectedUsuario!.id).toPromise().then((data) => {
        // Resetear flags y marcar según backend
        this.sensoresDisponibles.forEach(sensor => { sensor.asignado = false; });
        (data?.sensores || []).forEach((sensorAsignado: any) => {
          const sensor = this.sensoresDisponibles.find(s => s.codigo === sensorAsignado.codigo);
          if (sensor) sensor.asignado = true;
        });
        // Actualizar mapa local para chips de la tabla
        this.sensoresAsignaciones[this.selectedUsuario!.id] = data?.sensores || [];
        this.isLoadingSensores = false;
        this.notificationService.showUserSuccess('Sensores actualizados correctamente');
        this.dialog.closeAll();
      });
    }).catch((error) => {
      this.isLoadingSensores = false;
      console.error('Error al actualizar sensores:', error);
      this.notificationService.showUserError('actualizar sensores', 'Error al actualizar los sensores');
    });
  }
}
