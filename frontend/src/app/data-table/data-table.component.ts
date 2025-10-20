import { Component, AfterViewInit, ViewChild } from '@angular/core';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

interface DataItem {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  fecha: Date | string;
}

@Component({
  selector: 'app-data-table',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements AfterViewInit {
  
  dataItems: DataItem[] = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', estado: 'Aceptable', fecha: new Date('2024-01-15') },
    { id: 2, nombre: 'María García', email: 'maria@example.com', estado: 'Peligro', fecha: new Date('2024-01-10') },
    { id: 3, nombre: 'Carlos López', email: 'carlos@example.com', estado: 'Aceptable', fecha: new Date('2024-01-20') },
    { id: 4, nombre: 'Ana Martínez', email: 'ana@example.com', estado: 'Advertencia', fecha: new Date('2024-01-18') },
    { id: 5, nombre: 'Luis Rodríguez', email: 'luis@example.com', estado: 'Aceptable', fecha: new Date('2024-01-12') }
  ];

  // Variables para el CRUD
  dataSource = new MatTableDataSource<DataItem>([]);
  displayedColumns: string[] = ['id', 'nombre', 'email', 'estado', 'fecha', 'acciones'];
  isEditing = false;
  currentItem: DataItem = { id: 0, nombre: '', email: '', estado: '', fecha: new Date() };
  searchTerm = '';
  isLoading: boolean = false;

  // Estados disponibles
  estados = ['Aceptable', 'Peligro', 'Advertencia'];

  // Configuración del datepicker
  minDate = new Date(2025, 0, 1); // 1 de enero de 2025
  maxDate = new Date(2030, 11, 31); // 31 de diciembre de 2030

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dialog: MatDialog) {
    this.dataSource = new MatTableDataSource<DataItem>(this.dataItems);
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (item: DataItem, filter: string) => {
      const term = filter.trim().toLowerCase();
      return (
        item.nombre.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term)
      );
    };
  }

  // Filtrar datos
  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  // Abrir modal para crear
  openCreateModal(templateRef: any) {
    this.isEditing = false;
    this.currentItem = { id: 0, nombre: '', email: '', estado: 'Aceptable', fecha: this.getCurrentDate() };
    this.dialog.open(templateRef, { width: '420px' });
  }

  // Abrir modal para editar
  openEditModal(item: DataItem, templateRef: any) {
    this.isEditing = true;
    this.currentItem = { ...item };
    this.dialog.open(templateRef, { width: '420px' });
  }

  // Guardar (crear o actualizar)
  saveItem() {
    if (this.isEditing) {
      // Actualizar
      const index = this.dataItems.findIndex(item => item.id === this.currentItem.id);
      if (index !== -1) {
        this.dataItems[index] = { ...this.currentItem };
      }
    } else {
      // Crear
      this.currentItem.id = Math.max(...this.dataItems.map(item => item.id)) + 1;
      this.dataItems.push({ ...this.currentItem });
    }
    this.dataSource.data = [...this.dataItems];
    this.dialog.closeAll();
  }

  // Eliminar
  deleteItem(id: number, templateRef: any) {
    this.currentItem = this.dataItems.find(item => item.id === id) || this.currentItem;
    this.dialog.open(templateRef, { width: '420px' });
  }

  confirmDelete(): void {
    this.dataItems = this.dataItems.filter(item => item.id !== this.currentItem.id);
    this.dataSource.data = [...this.dataItems];
    this.dialog.closeAll();
  }

  // Obtener fecha actual
  public getCurrentDate(): Date {
    return new Date();
  }

  // Simular carga de datos
  loadData(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.dataSource.data = [...this.dataItems];
      this.isLoading = false;
    }, 1000);
  }

  // Obtener total de registros
  getTotalRecords(): number {
    return this.dataSource.filteredData.length;
  }

  // Obtener registros por estado
  getRecordsByStatus(status: string): number {
    return this.dataSource.filteredData.filter(item => item.estado === status).length;
  }
}
