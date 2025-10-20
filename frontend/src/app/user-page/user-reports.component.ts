import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../services/usuario.service';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { NotificationService } from '../shared/notification/notification.service';
import { ExportModalComponent } from './export-modal.component';

declare var Chart: any;

interface SensorReading {
  id: number;
  valor: number;
  estado: string;
  creado_en: string;
}

interface SensorDataResponse {
  mq135: SensorReading[];
  mq4: SensorReading[];
  mq7: SensorReading[];
}

interface ReportFilters {
  desde: string;  // ISO string para query
  hasta: string;  // ISO string para query
  sensores: string[];
  severidades: string[];
  incluirGraficos: boolean;
}

@Component({
  selector: 'app-user-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.css']
})
export class UserReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('comparisonChart', { static: false }) comparisonChart!: ElementRef;

  loading = false;
  reportData: SensorDataResponse | null = null;
  hasData = false;
  hasChartData = false;
  private chart: any;

  filters: ReportFilters = {
    desde: '',
    hasta: '',
    sensores: [],
    severidades: [],
    incluirGraficos: false
  };

  // Form reactivo para rango de fechas
  dateForm!: FormGroup;
  // Modelo legado (no usado para binding)
  dateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  

  sensorSelections = {
    mq135: false,
    mq4: false,
    mq7: false
  };

  severitySelections = {
    bueno: false,
    advertencia: false,
    malo: false
  };

  constructor(
    private usuarioService: UsuarioService,
    private notifications: NotificationService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.dateForm = this.fb.group({ start: [null], end: [null] });
  }

  ngAfterViewInit() {
    // El gráfico se creará cuando se carguen los datos
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initializeDateRange() {}

  // Ya no usamos handlers separados; el binding reactivo es suficiente

  private toIsoStartOfDay(d: Date): string {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt.toISOString();
  }

  private toIsoEndOfDay(d: Date): string {
    const dt = new Date(d);
    dt.setHours(23, 59, 59, 999);
    return dt.toISOString();
  }

  updateSensorSelection() {
    this.filters.sensores = [];
    if (this.sensorSelections.mq135) this.filters.sensores.push('mq135');
    if (this.sensorSelections.mq4) this.filters.sensores.push('mq4');
    if (this.sensorSelections.mq7) this.filters.sensores.push('mq7');
  }

  updateSeveritySelection() {
    this.filters.severidades = [];
    if (this.severitySelections.bueno) this.filters.severidades.push('bueno');
    if (this.severitySelections.advertencia) this.filters.severidades.push('advertencia');
    if (this.severitySelections.malo) this.filters.severidades.push('malo');
  }

  isFormValid(): boolean {
    return this.filters.sensores.length > 0 && this.filters.severidades.length > 0;
  }

  generarReporte() {
    if (!this.isFormValid()) {
      this.notifications.showWarning('Atención', 'Selecciona al menos un sensor y una severidad');
      return;
    }

    // Abrir modal de selección de formato inmediatamente
    this.abrirModalExportacion();
  }

  limpiarFiltros() {
    // Limpiar filtros
    this.filters = {
      desde: '',
      hasta: '',
      sensores: [],
      severidades: [],
      incluirGraficos: false
    };
    
    // Desmarcar todos los checkboxes
    this.sensorSelections = { mq135: false, mq4: false, mq7: false };
    this.severitySelections = { bueno: false, advertencia: false, malo: false };
    
    // Limpiar el formulario de fechas
    this.dateForm.patchValue({ start: null, end: null });
    
    // Limpiar datos del reporte
    this.reportData = null;
    this.hasData = false;
    this.hasChartData = false;
    
    // Destruir gráfico si existe
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    this.notifications.showSuccess('Filtros limpiados', 'Todos los filtros han sido restablecidos');
  }

  abrirModalExportacion() {
    const dialogRef = this.dialog.open(ExportModalComponent, {
      width: '500px',
      data: { filters: this.filters }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Generar el reporte con el formato seleccionado
        this.generarReporteConFormato(result);
      }
    });
  }

  generarReporteConFormato(formato: string) {
    this.loading = true;
    this.reportData = null;
    this.hasData = false;
    this.hasChartData = false;

    // Sincronizar fechas seleccionadas del date range picker
    const start: Date | null = this.dateForm?.value?.start ?? null;
    const end: Date | null = this.dateForm?.value?.end ?? null;
    
    console.log('📅 Fechas extraídas (reactive form):', { start, end });
    
    // Si ya guardamos con onDateRangeChanged, usamos esos valores; si no, convertimos aquí
    if (start) this.filters.desde = this.toIsoStartOfDay(start);
    if (end) this.filters.hasta = this.toIsoEndOfDay(end);

    // Construir parámetros de consulta (solo incluir si existen)
    const params = new URLSearchParams();
    if (this.filters.desde && this.filters.desde.length > 0) params.append('desde', this.filters.desde);
    if (this.filters.hasta && this.filters.hasta.length > 0) params.append('hasta', this.filters.hasta);
    if (this.filters.sensores.length > 0) params.append('sensores', this.filters.sensores.join(','));
    if (this.filters.severidades.length > 0) params.append('severidades', this.filters.severidades.join(','));

    console.log('🔍 Filtros enviados al backend:', {
      desde: this.filters.desde,
      hasta: this.filters.hasta,
      sensores: this.filters.sensores,
      severidades: this.filters.severidades
    });

    this.usuarioService.getUserReports(params.toString()).subscribe({
      next: (data: SensorDataResponse) => {
        console.log('📊 Datos recibidos del backend:', {
          mq135: data.mq135.length,
          mq4: data.mq4.length,
          mq7: data.mq7.length,
          primeraFecha: data.mq135[0]?.creado_en,
          ultimaFecha: data.mq135[data.mq135.length - 1]?.creado_en
        });
        
        this.reportData = data;
        this.hasData = data.mq135.length > 0 || data.mq4.length > 0 || data.mq7.length > 0;
        this.hasChartData = this.hasData && this.filters.incluirGraficos;
        
        this.loading = false;
        if (!this.hasData) {
          this.notifications.showWarning('Sin datos', 'No existen datos en el rango seleccionado');
          return;
        }

        // Si hay gráficos, esperar a que se generen antes de exportar
        if (this.hasChartData) {
          setTimeout(() => {
            this.createComparisonChart();
            // Esperar un poco más para que el canvas se renderice
            setTimeout(() => {
              this.notifications.showSuccess('Éxito', 'Reporte generado');
              this.ejecutarExportacion(formato);
            }, 500);
          }, 100);
        } else {
          // Sin gráficos, exportar inmediatamente
          this.notifications.showSuccess('Éxito', 'Reporte generado');
          this.ejecutarExportacion(formato);
        }
      },
      error: (error) => {
        this.loading = false;
        this.notifications.showError('Error', 'No se pudo generar el reporte');
      }
    });
  }

  ejecutarExportacion(formato: string) {
    switch (formato) {
      case 'csv':
        this.exportarCSV();
        break;
      case 'json':
        this.exportarJSON();
        break;
      case 'pdf':
        this.exportarPDF();
        break;
      case 'excel':
        this.exportarExcel();
        break;
    }
  }

  private createComparisonChart() {
    if (!this.comparisonChart || !this.reportData) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.comparisonChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData = this.prepareChartData();
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Tiempo'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Valor (ppm)'
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  private prepareChartData() {
    if (!this.reportData) return { labels: [], datasets: [] };

    const allTimestamps = new Set<string>();
    [...this.reportData.mq135, ...this.reportData.mq4, ...this.reportData.mq7].forEach(reading => {
      allTimestamps.add(reading.creado_en);
    });

    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    const mq135Map = new Map(this.reportData.mq135.map(r => [r.creado_en, r.valor]));
    const mq4Map = new Map(this.reportData.mq4.map(r => [r.creado_en, r.valor]));
    const mq7Map = new Map(this.reportData.mq7.map(r => [r.creado_en, r.valor]));

    const labels: string[] = [];
    const mq135Data: number[] = [];
    const mq4Data: number[] = [];
    const mq7Data: number[] = [];

    sortedTimestamps.forEach(timestamp => {
      const date = new Date(timestamp);
      labels.push(date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      mq135Data.push(mq135Map.get(timestamp) || 0);
      mq4Data.push(mq4Map.get(timestamp) || 0);
      mq7Data.push(mq7Map.get(timestamp) || 0);
    });

    const datasets = [];
    
    if (this.filters.sensores.includes('mq135') && this.reportData.mq135.length > 0) {
      datasets.push({
        label: 'MQ-135 (CO₂)',
        data: mq135Data,
        borderColor: 'rgba(142, 36, 170, 1)',
        backgroundColor: 'rgba(142, 36, 170, 0.2)',
        fill: false,
        tension: 0.4
      });
    }
    
    if (this.filters.sensores.includes('mq4') && this.reportData.mq4.length > 0) {
      datasets.push({
        label: 'MQ-4 (CH₄)',
        data: mq4Data,
        borderColor: 'rgba(233, 30, 99, 1)',
        backgroundColor: 'rgba(233, 30, 99, 0.2)',
        fill: false,
        tension: 0.4
      });
    }
    
    if (this.filters.sensores.includes('mq7') && this.reportData.mq7.length > 0) {
      datasets.push({
        label: 'MQ-7 (CO)',
        data: mq7Data,
        borderColor: 'rgba(0, 188, 212, 1)',
        backgroundColor: 'rgba(0, 188, 212, 0.2)',
        fill: false,
        tension: 0.4
      });
    }

    return { labels, datasets };
  }

  exportarCSV() {
    if (!this.reportData) return;
    
    const csvContent = this.generateCSV();
    this.downloadFile(csvContent, 'reporte-sensores.csv', 'text/csv');
  }

  exportarJSON() {
    if (!this.reportData) return;
    
    const jsonContent = JSON.stringify(this.reportData, null, 2);
    this.downloadFile(jsonContent, 'reporte-sensores.json', 'application/json');
  }

  exportarPDF() {
    if (!this.reportData) return;
    
    const filtered = this.filterByDate(this.reportData);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Colores para cada sensor
    const colors = {
      mq135: { bg: [255, 200, 200], text: [139, 0, 0] }, // Rojo claro
      mq4: { bg: [200, 200, 255], text: [0, 0, 139] },   // Azul claro
      mq7: { bg: [255, 255, 200], text: [139, 139, 0] }  // Amarillo claro
    };

    // Función para agregar sección de sensor
    const addSensorSection = (sensorData: any[], sensorName: string, color: any) => {
      if (sensorData.length === 0) return;

      // Título con fondo de color
      doc.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
      doc.rect(margin, yPosition - 5, contentWidth, 15, 'F');
      
      doc.setTextColor(color.text[0], color.text[1], color.text[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Datos ${sensorName.toUpperCase()}`, margin + 5, yPosition + 5);
      
      yPosition += 20;

      // Encabezados de tabla con fondo
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ID', margin + 5, yPosition + 2);
      doc.text('Valor (ppm)', margin + 25, yPosition + 2);
      doc.text('Estado', margin + 60, yPosition + 2);
      doc.text('Fecha', margin + 100, yPosition + 2);
      
      yPosition += 15;

      // Datos de la tabla (sin límite; se pagina automáticamente)
      doc.setFont('helvetica', 'normal');
      sensorData.forEach((lectura, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        // Fondo alternado para filas
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, yPosition - 3, contentWidth, 8, 'F');
        }

        doc.setTextColor(0, 0, 0);
        doc.text(lectura.id.toString(), margin + 5, yPosition + 2);
        doc.text(lectura.valor.toFixed(2), margin + 25, yPosition + 2);
        
        // Estado con color según severidad
        const estadoColor = this.getEstadoColor(lectura.estado);
        doc.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2]);
        doc.text(lectura.estado, margin + 60, yPosition + 2);
        
        doc.setTextColor(0, 0, 0);
        doc.text(new Date(lectura.creado_en).toLocaleString('es-ES'), margin + 100, yPosition + 2);
        
        yPosition += 8;
      });
      
      yPosition += 15;
    };

    // Título principal
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Sensores', margin, 25);

    // Rango de fechas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const fechaDesde = this.filters.desde ? new Date(this.filters.desde).toLocaleDateString('es-ES') : 'N/A';
    const fechaHasta = this.filters.hasta ? new Date(this.filters.hasta).toLocaleDateString('es-ES') : 'N/A';
    doc.text(`Período: ${fechaDesde} - ${fechaHasta}`, margin, 35);

    let yPosition = 50;

    // Si se solicita, incrustar gráfico comparativo como imagen
    if (this.filters.incluirGraficos && this.comparisonChart && this.comparisonChart.nativeElement) {
      try {
        const canvasEl: HTMLCanvasElement = this.comparisonChart.nativeElement as HTMLCanvasElement;
        if (canvasEl.width > 0 && canvasEl.height > 0) {
          const dataUrl = canvasEl.toDataURL('image/png', 1.0);
          const imgWidth = contentWidth;
          const imgHeight = (canvasEl.height / canvasEl.width) * imgWidth;
          doc.addImage(dataUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }
      } catch (e) {
        console.warn('No se pudo incrustar el gráfico en PDF:', e);
      }
    }

    // Agregar secciones de sensores
    addSensorSection(filtered.mq135, 'MQ135', colors.mq135);
    addSensorSection(filtered.mq4, 'MQ4', colors.mq4);
    addSensorSection(filtered.mq7, 'MQ7', colors.mq7);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, margin, doc.internal.pageSize.getHeight() - 10);

    const filename = `reporte_sensores_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfBlob = doc.output('blob');
    this.downloadFile(pdfBlob, filename, 'application/pdf');
  }

  private getEstadoColor(estado: string): [number, number, number] {
    switch (estado.toLowerCase()) {
      case 'bueno': return [0, 128, 0];      // Verde
      case 'advertencia': return [255, 165, 0]; // Naranja
      case 'malo': return [255, 0, 0];       // Rojo
      default: return [0, 0, 0];             // Negro
    }
  }

  exportarExcel() {
    if (!this.reportData) return;
    const filtered = this.filterByDate(this.reportData);

    if (!this.filters.incluirGraficos) {
      // Caso simple: mantener exportación con XLSX como antes (sin gráficos)
      const wb = XLSX.utils.book_new();
      const toSheet = (rows: any[], sensor: string) => {
        const data = rows.map(r => ({
          Sensor: sensor,
          Valor_ppm: r.valor,
          Estado: r.estado,
          Fecha: new Date(r.creado_en).toLocaleString('es-ES')
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sensor);
      };
      toSheet(filtered.mq135, 'MQ-135');
      toSheet(filtered.mq4, 'MQ-4');
      toSheet(filtered.mq7, 'MQ-7');
      XLSX.writeFile(wb, 'reporte-sensores.xlsx');
      return;
    }

    // Con gráficos: usar ExcelJS e insertar imagen del canvas
    const workbook = new ExcelJS.Workbook();

    const addSheet = (name: string, rows: any[]) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Valor (ppm)', key: 'valor', width: 12 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Fecha', key: 'fecha', width: 22 },
      ];
      rows.forEach(r => sheet.addRow({
        id: r.id,
        valor: Number(r.valor.toFixed ? r.valor.toFixed(2) : r.valor),
        estado: r.estado,
        fecha: new Date(r.creado_en).toLocaleString('es-ES')
      }));
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 4 } };
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      return sheet;
    };

    if (filtered.mq135.length > 0) addSheet('MQ-135 (CO₂)', filtered.mq135);
    if (filtered.mq4.length > 0) addSheet('MQ-4 (CH₄)', filtered.mq4);
    if (filtered.mq7.length > 0) addSheet('MQ-7 (CO)', filtered.mq7);

    // Hoja de resumen con estadísticas y gráfico
    const summary = workbook.addWorksheet('Resumen');
    
    // Título y período
    summary.getCell('A1').value = 'RESUMEN GENERAL';
    summary.getCell('A1').font = { bold: true, size: 16 };
    summary.getCell('A2').value = `Período: ${this.filters.desde ? new Date(this.filters.desde).toLocaleDateString('es-ES') : 'N/A'} - ${this.filters.hasta ? new Date(this.filters.hasta).toLocaleDateString('es-ES') : 'N/A'}`;
    summary.getCell('A2').font = { bold: true };

    // Estadísticas por sensor
    let row = 4;
    summary.getCell(`A${row}`).value = 'Sensor';
    summary.getCell(`B${row}`).value = 'Total Lecturas';
    summary.getCell(`C${row}`).value = 'Promedio (ppm)';
    summary.getCell(`D${row}`).value = 'Máximo (ppm)';
    summary.getCell(`E${row}`).value = 'Mínimo (ppm)';
    
    // Encabezados en negrita
    for (let col = 1; col <= 5; col++) {
      summary.getCell(row, col).font = { bold: true };
      summary.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    }
    row++;

    // Datos de cada sensor
    if (filtered.mq135.length > 0) {
      summary.getCell(`A${row}`).value = 'MQ-135 (CO₂)';
      summary.getCell(`B${row}`).value = filtered.mq135.length;
      summary.getCell(`C${row}`).value = (filtered.mq135.reduce((sum, r) => sum + r.valor, 0) / filtered.mq135.length).toFixed(2);
      summary.getCell(`D${row}`).value = Math.max(...filtered.mq135.map(r => r.valor)).toFixed(2);
      summary.getCell(`E${row}`).value = Math.min(...filtered.mq135.map(r => r.valor)).toFixed(2);
      row++;
    }

    if (filtered.mq4.length > 0) {
      summary.getCell(`A${row}`).value = 'MQ-4 (CH₄)';
      summary.getCell(`B${row}`).value = filtered.mq4.length;
      summary.getCell(`C${row}`).value = (filtered.mq4.reduce((sum, r) => sum + r.valor, 0) / filtered.mq4.length).toFixed(2);
      summary.getCell(`D${row}`).value = Math.max(...filtered.mq4.map(r => r.valor)).toFixed(2);
      summary.getCell(`E${row}`).value = Math.min(...filtered.mq4.map(r => r.valor)).toFixed(2);
      row++;
    }

    if (filtered.mq7.length > 0) {
      summary.getCell(`A${row}`).value = 'MQ-7 (CO)';
      summary.getCell(`B${row}`).value = filtered.mq7.length;
      summary.getCell(`C${row}`).value = (filtered.mq7.reduce((sum, r) => sum + r.valor, 0) / filtered.mq7.length).toFixed(2);
      summary.getCell(`D${row}`).value = Math.max(...filtered.mq7.map(r => r.valor)).toFixed(2);
      summary.getCell(`E${row}`).value = Math.min(...filtered.mq7.map(r => r.valor)).toFixed(2);
      row++;
    }

    // Ajustar anchos de columna
    summary.columns = [
      { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];

    // Insertar gráfico como imagen
    try {
      const canvasEl: HTMLCanvasElement = this.comparisonChart?.nativeElement as HTMLCanvasElement;
      if (canvasEl && canvasEl.width > 0 && canvasEl.height > 0 && this.filters.incluirGraficos) {
        const dataUrl = canvasEl.toDataURL('image/png', 1.0);
        const imageId = workbook.addImage({ base64: dataUrl, extension: 'png' });
        // Colocar imagen debajo de las estadísticas
        summary.addImage(imageId, {
          tl: { col: 0, row: row + 2 },
          ext: { width: 800, height: 400 }
        });
      }
    } catch (e) {
      console.warn('No se pudo incrustar el gráfico en Excel:', e);
    }

    workbook.xlsx.writeBuffer().then((buffer) => {
      this.downloadFile(buffer, `reporte_sensores_${new Date().toISOString().split('T')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  }

  private filterByDate(data: SensorDataResponse): SensorDataResponse {
    const from = this.filters.desde ? new Date(this.filters.desde).getTime() : null;
    const to = this.filters.hasta ? new Date(this.filters.hasta).getTime() : null;

    const parseDateMs = (raw: string): number | null => {
      let d = new Date(raw);
      if (isNaN(d.getTime())) {
        // Intentar con espacio en vez de 'T'
        d = new Date(raw.replace(' ', 'T'));
      }
      const ms = d.getTime();
      return isNaN(ms) ? null : ms;
    };

    const inRange = (raw: string) => {
      const t = parseDateMs(raw);
      if (t === null) return false; // descartar fechas inválidas
      if (from !== null && t < from) return false;
      if (to !== null && t > to) return false; // inclusivo hasta endOfDay porque to ya es fin de día
      return true;
    };

    const filterArr = (arr: SensorReading[]) => arr.filter(r => inRange(r.creado_en));

    return {
      mq135: filterArr(data.mq135),
      mq4: filterArr(data.mq4),
      mq7: filterArr(data.mq7)
    };
  }

  private generateCSV(): string {
    if (!this.reportData) return '';

    const headers = ['Sensor', 'Valor (ppm)', 'Estado', 'Fecha'];
    const rows = [headers.join(',')];

    // Agregar datos de cada sensor
    this.reportData.mq135.forEach(reading => {
      rows.push([
        'MQ-135',
        reading.valor.toString(),
        reading.estado,
        new Date(reading.creado_en).toLocaleString('es-ES')
      ].join(','));
    });

    this.reportData.mq4.forEach(reading => {
      rows.push([
        'MQ-4',
        reading.valor.toString(),
        reading.estado,
        new Date(reading.creado_en).toLocaleString('es-ES')
      ].join(','));
    });

    this.reportData.mq7.forEach(reading => {
      rows.push([
        'MQ-7',
        reading.valor.toString(),
        reading.estado,
        new Date(reading.creado_en).toLocaleString('es-ES')
      ].join(','));
    });

    return rows.join('\n');
  }

  private downloadFile(content: any, filename: string, mimeType: string) {
    try {
      let blob: Blob;
      
      if (content instanceof Blob) {
        blob = content;
      } else {
        blob = new Blob([content], { type: mimeType });
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: abrir en nueva pestaña
      let blob: Blob;
      if (content instanceof Blob) {
        blob = content;
      } else {
        blob = new Blob([content], { type: mimeType });
      }
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }
}
